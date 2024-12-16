"use client"

import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export default function CaptureImage() {
    const [estudianteId, setEstudianteId] = useState('');
    const [foto, setFoto] = useState(null);
    const [resultado, setResultado] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const videoCanvasRef = useRef(null);

    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
                console.log("Modelos cargados correctamente");
            } catch (error) {
                console.error("Error al cargar los modelos:", error);
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            } catch (err) {
                console.error('Error accessing camera: ', err);
            }
        };
        startCamera();
    }, []);

    useEffect(() => {
        const detectFace = async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                const options = new faceapi.TinyFaceDetectorOptions();
                const detections = await faceapi.detectAllFaces(videoRef.current, options);
    
                const canvas = videoCanvasRef.current;
                const context = canvas.getContext('2d');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                context.clearRect(0, 0, canvas.width, canvas.height);
    
                // Dibuja los cuadros de detección
                faceapi.draw.drawDetections(canvas, detections);
            }
            requestAnimationFrame(detectFace);
        };
        detectFace();
    }, []);

    const handleTakePhoto = async () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Establece el tamaño del canvas a 128x128 píxeles
        canvas.width = 128;
        canvas.height = 128;

        // Dibuja la imagen de la cámara en el canvas con el tamaño especificado
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 128, // Tamaño de la entrada
            scoreThreshold: 0.5 // Umbral de puntuación
        });
    
        const detections = await faceapi.detectAllFaces(canvas, options);    
        if (detections.length === 0) {
            alert('No se encontró ninguna cara en la imagen');
            return;
        }
    
        canvas.toBlob((blob) => {
            const fileName = `comparacion_${estudianteId}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            setFoto(file);
        }, 'image/jpeg'); // Asegúrate de que la imagen esté en formato JPEG
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!estudianteId) {
            alert('Por favor, proporciona el ID del estudiante.');
            return;
        }

        await handleTakePhoto();

        if (!foto) {
            alert('No se pudo capturar la foto.');
            return;
        }

        const formData = new FormData();
        formData.append('estudiante_id', estudianteId);
        formData.append('foto', foto);

        try {
            const res = await fetch('http://localhost:8000/api/comparar_estudiante/', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Error:', errorData);
                alert(`Error: ${errorData.message}`);
                return;
            }

            const data = await res.json();
            setResultado(data.es_similar ? 'Las caras son similares' : 'Las caras no son similares');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al comparar las caras');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col bg-blue-900 p-8 rounded-lg shadow-lg text-white w-full max-w-4xl">
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="w-full">
                    <h2 className="text-2xl font-bold mb-6 text-center">Comparar Estudiante</h2>
                    <div className="mb-4">
                        <label className="block mb-2">ID del Estudiante:</label>
                        <input type="text" value={estudianteId} onChange={(e) => setEstudianteId(e.target.value)} required className="w-full p-3 rounded bg-blue-800 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Foto:</label>
                        <div className="relative">
                            <video ref={videoRef} className="w-full mb-4"></video>
                            <canvas ref={videoCanvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>
                    </div>
                    <button type="submit" className="w-full p-3 rounded bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600">Comparar Estudiante</button>
                </form>
                <div className="flex justify-center mt-8">
                </div>
                {resultado && (
                    <div className="mt-4 p-4 bg-white text-blue-900 rounded-lg shadow-lg">
                        <p>{resultado}</p>
                    </div>
                )}
            </div>
        </div>
    );
}