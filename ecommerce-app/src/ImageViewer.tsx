import React from "react";
import './ImageViewer.css';

type ImageViewerProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

function ImageViewer(props: ImageViewerProps) {
    const { src, alt, onClose } = props;
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>x</button>
                <img src={src} alt={alt} className="modal-image" />
            </div>
        </div>
    );
};

export default ImageViewer;
