import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Button, Select } from "../index";
import { cropReviewService } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Upload, X, Camera, ImageIcon } from "lucide-react";

function CropPhotoForm({ initialData = null, isEdit = false }) {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        defaultValues: initialData || {}
    });

    React.useEffect(() => {
        if (initialData) {
            Object.keys(initialData).forEach((key) => {
                setValue(key, initialData[key]);
            });
            if (initialData.images?.length) {
                setPreviews(initialData.images.map((img) => ({ url: img.url, existing: true })));
            }
        }
    }, [initialData, setValue]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5);
        setImages(files);
        setPreviews(files.map((file) => ({
            url: URL.createObjectURL(file),
            existing: false,
            name: file.name
        })));
    };

    const removePreview = (index) => {
        const newPreviews = previews.filter((_, i) => i !== index);
        setPreviews(newPreviews);
        if (!previews[index]?.existing) {
            const fileIndex = previews.slice(0, index).filter((p) => !p.existing).length;
            setImages(images.filter((_, i) => i !== fileIndex));
        }
    };

    const onSubmit = async (data) => {
        if (!isEdit && images.length === 0) {
            setError("Please upload at least one crop photo");
            return;
        }

        setLoading(true);
        setError("");

        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (key !== "images") {
                formData.append(key, data[key]);
            }
        });

        images.forEach((file) => {
            formData.append("images", file);
        });

        try {
            const res = isEdit
                ? await cropReviewService.update(initialData._id, formData)
                : await cropReviewService.create(formData);

            if (res.data.success) {
                navigate(`/crops/${res.data.data._id || initialData._id}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to share crop photos");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-800/80">
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <Camera size={22} className="text-green-500" />
                    {isEdit ? "Update Crop Photos" : "Share Your Crop Photos"}
                </h2>
                <p className="text-sm text-slate-400">
                    Upload photos of your crop so other farmers can see, review, and ask questions.
                </p>
            </div>

            {error && (
                <p className="text-red-500 text-sm bg-red-500/10 px-4 py-2.5 rounded-xl border border-red-500/20">
                    {error}
                </p>
            )}

            {/* Photo upload — primary action */}
            <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2 pl-1">
                    Crop Photos {!isEdit && <span className="text-red-400">*</span>} (up to 5)
                </label>
                <div className="relative border-2 border-dashed border-green-500/30 rounded-2xl p-8 bg-green-500/5 flex flex-col items-center justify-center cursor-pointer hover:bg-green-500/10 hover:border-green-500/50 transition-all">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <ImageIcon size={40} className="text-green-500 mb-3" />
                    <span className="text-sm font-semibold text-slate-200">
                        {images.length > 0 ? `${images.length} photo(s) selected` : "Click to upload crop photos"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP — show your field, harvest, or crop condition</span>
                </div>

                {previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                        {previews.map((preview, index) => (
                            <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-800 aspect-square">
                                <img src={preview.url} alt="" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePreview(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                    label="Crop Name: "
                    placeholder="e.g. Basmati Rice, Wheat, Potato"
                    {...register("cropName", { required: "Crop name is required" })}
                />
                <Select
                    label="Season: "
                    options={[
                        { label: "Select season", value: "" },
                        { label: "Kharif", value: "Kharif" },
                        { label: "Rabi", value: "Rabi" },
                        { label: "Zaid", value: "Zaid" }
                    ]}
                    {...register("season", { required: "Season is required" })}
                />
                <Input
                    label="Soil Type: "
                    placeholder="e.g. Alluvial, Clayey, Sandy"
                    {...register("soilType", { required: "Soil type is required" })}
                />
                <Input
                    label="Irrigation Method: "
                    placeholder="e.g. Drip, Canal, Tube Well"
                    {...register("irrigationMethod", { required: "Irrigation method is required" })}
                />
                <Input
                    label="Fertilizer Used: "
                    placeholder="e.g. Urea + NPK 19:19:19"
                    {...register("fertilizerUsed", { required: "Fertilizer details are required" })}
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
            </div>

            <div className="space-y-4">
                <Select
                    label="Your Self-Rating (1–5 Stars): "
                    options={["5", "4", "3", "2", "1"]}
                    {...register("rating", { required: true })}
                />

                <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1.5 pl-1">
                        Describe your crop experience:
                    </label>
                    <textarea
                        className="w-full px-4 py-2.5 min-h-[120px] rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                        placeholder="Share sowing date, challenges, yield tips, pest issues, and what worked for you..."
                        {...register("description", { required: "Description is required" })}
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3"
            >
                {loading ? "Uploading..." : isEdit ? "Update Crop Post" : "Share Crop Photos"}
            </Button>
        </form>
    );
}

export default CropPhotoForm;
