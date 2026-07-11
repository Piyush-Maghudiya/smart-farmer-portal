import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Select } from "../index";
import { cropReviewService, seedReviewService, fertilizerReviewService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Upload, X, HelpCircle } from "lucide-react";

function ReviewForm({ initialData = null, type = "crop", isEdit = false }) {
    const navigate = useNavigate();
    const [reviewType, setReviewType] = useState(type);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: initialData || {}
    });

    useEffect(() => {
        if (initialData) {
            setReviewType(type);
            // Pre-fill form fields
            Object.keys(initialData).forEach((key) => {
                setValue(key, initialData[key]);
            });
        }
    }, [initialData, type, setValue]);

    const handleTypeChange = (e) => {
        if (!isEdit) {
            setReviewType(e.target.value);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");
        
        const formData = new FormData();
        // Append all text inputs
        Object.keys(data).forEach((key) => {
            if (key !== "images") {
                formData.append(key, data[key]);
            }
        });

        // Append files
        images.forEach((file) => {
            formData.append("images", file);
        });

        try {
            let res;
            if (reviewType === "crop") {
                res = isEdit 
                    ? await cropReviewService.update(initialData._id, formData)
                    : await cropReviewService.create(formData);
            } else if (reviewType === "seed") {
                res = isEdit
                    ? await seedReviewService.update(initialData._id, formData)
                    : await seedReviewService.create(formData);
            } else if (reviewType === "fertilizer") {
                res = isEdit
                    ? await fertilizerReviewService.update(initialData._id, formData)
                    : await fertilizerReviewService.create(formData);
            }

            if (res.data.success) {
                navigate("/reviews");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-800/80">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                🌾 {isEdit ? "Edit Review" : "Publish a Review"}
            </h2>

            {error && <p className="text-red-500 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">{error}</p>}

            {/* Review Type Selection */}
            {!isEdit && (
                <Select
                    label="Review Category: "
                    options={[
                        { label: "Crop Sowing & Yield Review", value: "crop" },
                        { label: "Seed Brand Performance", value: "seed" },
                        { label: "Fertilizer Effectiveness", value: "fertilizer" }
                    ]}
                    onChange={handleTypeChange}
                    value={reviewType}
                />
            )}

            {/* Dynamic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reviewType === "crop" && (
                    <>
                        <Input
                            label="Crop Name: "
                            placeholder="e.g. Basmati Rice, Wheat"
                            {...register("cropName", { required: "Crop Name is required" })}
                        />
                        <Input
                            label="Season: "
                            placeholder="e.g. Rabi, Kharif"
                            {...register("season", { required: "Season is required" })}
                        />
                        <Input
                            label="Soil Type: "
                            placeholder="e.g. Clayey, Alluvial, Sandy"
                            {...register("soilType", { required: "Soil Type is required" })}
                        />
                        <Input
                            label="Irrigation Method: "
                            placeholder="e.g. Drip Irrigation, Canal, Tube Well"
                            {...register("irrigationMethod", { required: "Irrigation method is required" })}
                        />
                        <Input
                            label="Fertilizer Used: "
                            placeholder="e.g. Urea + NPK 19:19:19"
                            {...register("fertilizerUsed", { required: "Fertilizers details are required" })}
                        />
                        <Input
                            label="Expected Yield: "
                            placeholder="e.g. 25 Quintal/Acre"
                            {...register("expectedYield")}
                        />
                        <Input
                            label="Actual Yield: "
                            placeholder="e.g. 23 Quintal/Acre"
                            {...register("actualYield")}
                        />
                        <Input
                            label="State: "
                            placeholder="e.g. Punjab"
                            {...register("state", { required: "State is required" })}
                        />
                        <Input
                            label="District: "
                            placeholder="e.g. Ludhiana"
                            {...register("district", { required: "District is required" })}
                        />
                    </>
                )}

                {reviewType === "seed" && (
                    <>
                        <Input
                            label="Seed Brand: "
                            placeholder="e.g. Pioneer, Mahyco, Bayer"
                            {...register("seedBrand", { required: "Seed Brand is required" })}
                        />
                        <Input
                            label="Crop Name: "
                            placeholder="e.g. Cotton, Maize"
                            {...register("cropName", { required: "Crop Name is required" })}
                        />
                        <Input
                            label="Germination Rate: "
                            placeholder="e.g. 90%, 95%"
                            {...register("germinationRate", { required: "Germination rate is required" })}
                        />
                        <Input
                            label="Disease Resistance: "
                            placeholder="e.g. High, Medium, Stem Blight resistant"
                            {...register("diseaseResistance", { required: "Disease resistance description is required" })}
                        />
                        <Input
                            label="Price (per kg/packet): "
                            type="number"
                            placeholder="e.g. 350"
                            {...register("price", { required: "Price is required" })}
                        />
                    </>
                )}

                {reviewType === "fertilizer" && (
                    <>
                        <Input
                            label="Fertilizer Name: "
                            placeholder="e.g. IFFCO NPK 12:32:16, DAP"
                            {...register("fertilizerName", { required: "Fertilizer name is required" })}
                        />
                        <Input
                            label="Suitable Crop: "
                            placeholder="e.g. Sugarcane, Potato"
                            {...register("suitableCrop", { required: "Suitable Crop details are required" })}
                        />
                        <Input
                            label="Usage Method: "
                            placeholder="e.g. Basal dressing during sowing, foliar spray"
                            {...register("usageMethod", { required: "Usage Method is required" })}
                        />
                        <Input
                            label="Effectiveness / Outcome: "
                            placeholder="e.g. Increased tuber size, fast vegetative growth"
                            {...register("effectiveness", { required: "Effectiveness results are required" })}
                        />
                    </>
                )}
            </div>

            {/* Common Inputs */}
            <div className="space-y-4">
                <Select
                    label="Rating (1 to 5 Stars): "
                    options={["5", "4", "3", "2", "1"]}
                    {...register("rating", { required: true })}
                />
                
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5 pl-1">
                        Detailed Description:
                    </label>
                    <textarea
                        className="w-full px-4 py-2.5 min-h-[120px] rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                        placeholder="Share your personal farming experience with this item..."
                        {...register("description", { required: "Description is required" })}
                    />
                </div>

                {/* File Upload Selector */}
                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5 pl-1">
                        Attach Photos or Videos (Max 5):
                    </label>
                    <div className="relative border border-dashed border-slate-800 rounded-xl p-6 bg-slate-950/20 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-950/40 hover:border-slate-700 transition-all duration-200">
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload size={32} className="text-slate-500 mb-2" />
                        <span className="text-sm font-medium text-slate-300">
                            {images.length > 0 ? `${images.length} files chosen` : "Drag and drop or click to upload files"}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">Photos (PNG, JPG, JPEG) or Videos (MP4, WebM) accepted</span>
                    </div>

                    {/* Preview chosen files */}
                    {images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {images.map((file, index) => {
                                const isVideo = file.type.startsWith("video/");
                                return (
                                    <span key={index} className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                        {isVideo ? "🎥" : "🖼️"} {file.name}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold"
            >
                {loading ? "Publishing Review..." : isEdit ? "Update Review" : "Publish Review"}
            </Button>
        </form>
    );
}

export default ReviewForm;
