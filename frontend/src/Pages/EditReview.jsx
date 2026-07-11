import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { cropReviewService, seedReviewService, fertilizerReviewService } from "../services/api";
import ReviewForm from "../components/Reviews/ReviewForm";
import Container from "../components/container/Container";

function EditReview() {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReview = async () => {
            try {
                let res;
                if (type === "crop") res = await cropReviewService.getById(id);
                else if (type === "seed") res = await seedReviewService.getById(id);
                else if (type === "fertilizer") res = await fertilizerReviewService.getById(id);

                if (res.data.success) {
                    setReview(res.data.data);
                }
            } catch (err) {
                setError("Failed to fetch review details for editing");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchReview();
    }, [type, id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !review) {
        return (
            <Container className="py-20 text-center">
                <p className="text-red-500 text-sm">{error || "Review not found"}</p>
                <Link to="/reviews" className="text-green-500 font-bold hover:underline">Back to Reviews</Link>
            </Container>
        );
    }

    return (
        <div className="py-12">
            <Container className="max-w-3xl space-y-6">
                <Link to={`/reviews/${type}/${id}`} className="text-sm font-bold text-green-500 hover:text-green-400">
                    ← Back to Detail View
                </Link>
                <ReviewForm initialData={review} type={type} isEdit={true} />
            </Container>
        </div>
    );
}

export default EditReview;
