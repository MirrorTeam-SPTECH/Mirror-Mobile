import React, { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function WebCameraModal({ visible, onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!visible) return;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => {
        alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
        onClose();
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [visible]);

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.8);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onCapture({ uri: dataUrl, base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
  };

  if (!visible) return null;

  return ReactDOM.createPortal(
    <div style={styles.overlay}>
      <video ref={videoRef} autoPlay playsInline style={styles.video} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <p style={styles.hint}>Posicione o objeto na tela e clique em Capturar</p>
      <div style={styles.btnRow}>
        <button onClick={capture} style={styles.captureBtn}>Capturar foto</button>
        <button onClick={onClose} style={styles.cancelBtn}>Cancelar</button>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#000',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  video: {
    width: '100%',
    maxWidth: 640,
    borderRadius: 12,
    background: '#111',
  },
  hint: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  btnRow: {
    display: 'flex',
    gap: 16,
    marginTop: 8,
  },
  captureBtn: {
    padding: '14px 36px',
    background: '#D91C1C',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: '600',
  },
  cancelBtn: {
    padding: '14px 36px',
    background: '#444',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    cursor: 'pointer',
  },
};
