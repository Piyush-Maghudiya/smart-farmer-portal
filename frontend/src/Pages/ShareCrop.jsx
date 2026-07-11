import React from "react";
import CropPhotoForm from "../components/Reviews/CropPhotoForm";
import Container from "../components/container/Container";
import { Link } from "react-router-dom";

function ShareCrop() {
    return (
        <div className="py-12">
            <Container className="max-w-3xl space-y-6">
                <Link to="/crops" className="text-sm font-bold text-green-500 hover:text-green-400">
                    ← Back to Crop Gallery
                </Link>
                <CropPhotoForm />
            </Container>
        </div>
    );
}

export default ShareCrop;
