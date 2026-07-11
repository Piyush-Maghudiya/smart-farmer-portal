import React from "react";
import ReviewForm from "../components/Reviews/ReviewForm";
import Container from "../components/container/Container";
import { Link } from "react-router-dom";

function AddReview() {
    return (
        <div className="py-12">
            <Container className="max-w-3xl space-y-6">
                <Link to="/reviews" className="text-sm font-bold text-green-500 hover:text-green-400">
                    ← Back to Reviews
                </Link>
                <ReviewForm />
            </Container>
        </div>
    );
}

export default AddReview;
