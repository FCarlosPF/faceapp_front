"use client"

import { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export default function RegistrarEstudianteForm() {
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [correo, setCorreo] = useState('');
    const [numeroMatricula, setNumeroMatricula] = useState('');
    const [foto, setFoto] = useState(null);
    const [fotoUrl, setFotoUrl] = useState(null);
    const [useCamera, setUseCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('apellido', apellido);
        formData.append('correo', correo);
        formData.append('numero_matricula', numeroMatricula);
        formData.append('foto', foto);

        // Log the form data
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        try {
            const res = await fetch('http://localhost:8000/api/registrar_estudiante/', {
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
            if (data.status === 'success') {
                alert('Estudiante registrado exitosamente');
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al registrar el estudiante');
        }
    };

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
            const fileName = `${nombre}_${apellido}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            setFoto(file);
            setFotoUrl(URL.createObjectURL(file));
        }, 'image/jpeg'); // Asegúrate de que la imagen esté en formato JPEG
    };

    const handleUseCamera = () => {
        setUseCamera(true);
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            })
            .catch((err) => {
                console.error('Error accessing camera: ', err);
            });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex bg-blue-900 p-8 rounded-lg shadow-lg text-white w-full max-w-4xl">
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-6 text-center">Registrar Estudiante</h2>
                    <div className="mb-4">
                        <label className="block mb-2">Nombre:</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full p-3 rounded bg-blue-800 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Apellido:</label>
                        <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required className="w-full p-3 rounded bg-blue-800 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Correo:</label>
                        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required className="w-full p-3 rounded bg-blue-800 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Número de Matrícula:</label>
                        <input type="text" value={numeroMatricula} onChange={(e) => setNumeroMatricula(e.target.value)} required className="w-full p-3 rounded bg-blue-800 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Foto:</label>
                        {useCamera ? (
                            <div>
                                <video ref={videoRef} className="w-full mb-4"></video>
                                <button type="button" onClick={handleTakePhoto} className="w-full p-3 rounded bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600">Tomar Foto</button>
                                <canvas ref={canvasRef} className="hidden"></canvas>
                            </div>
                        ) : (
                            <input type="file" onChange={(e) => setFoto(e.target.files[0])} required className="w-full p-3 rounded bg-blue-800 border border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                        )}
                        <button type="button" onClick={handleUseCamera} className="w-full p-3 mt-2 rounded bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600">Usar Cámara</button>
                    </div>
                    <button type="submit" className="w-full p-3 rounded bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600">Registrar Estudiante</button>
                </form>
                <div className="ml-8">
                    {fotoUrl && <img src={fotoUrl} alt="Foto tomada" className="w-64 h-64 object-cover rounded-lg shadow-lg" />}
                </div>
            </div>
        </div>
    );
}