import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { seedReviewService, fertilizerReviewService } from "../services/api";
import { Container, Input, Select, Button } from "../components/index";
import { Upload, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";

function UploadProduct() {
    const navigate = useNavigate();
    const { userData } = useSelector((state) => state.auth);
    const [productType, setProductType] = useState("seed"); // seed, fertilizer
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm();

    // Check if user is seller or admin
    const isSellerOrAdmin = userData && (userData.role === "seller" || userData.role === "admin");

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setImages(files);
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");

        const formData = new FormData();
        // Append text fields
        Object.keys(data).forEach((key) => {
            formData.append(key, data[key]);
        });

        // Append images
        images.forEach((file) => {
            formData.append("images", file);
        });

        try {
            let res;
            if (productType === "seed") {
                res = await seedReviewService.create(formData);
            } else if (productType === "fertilizer") {
                res = await fertilizerReviewService.create(formData);
            }

            if (res?.data?.success) {
                navigate(`/marketplace?tab=${productType}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to upload product listing.");
        } finally {
            setLoading(false);
        }
    };

    if (!isSellerOrAdmin) {
        return (
            <div className="py-16">
                <Container className="max-w-2xl text-center space-y-6">
                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center gap-4">
                        <ShieldAlert className="text-red-500" size={48} />
                        <h2 className="text-xl font-bold text-slate-100">Access Denied</h2>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Only registered Agro Companies and Seed/Fertilizer Sellers have access to list products in the marketplace.
                        </p>
                        <p className="text-xs text-slate-500">
                            Current Role: <span className="text-slate-300 font-bold uppercase">{userData?.role || "guest"}</span>
                        </p>
                        <div className="pt-2 flex flex-wrap gap-4 justify-center">
                            <Link to="/marketplace" className="px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:border-slate-700">
                                Browse Marketplace
                            </Link>
                            <Link to="/signup" className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold">
                                Register as Seller
                            </Link>
                        </div>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="py-12">
            <Container className="max-w-3xl space-y-8">
                {/* Back Link */}
                <Link to="/marketplace" className="flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-400 select-none">
                    <ArrowLeft size={14} /> Back to Catalog
                </Link>

                {/* Form Wrapper */}
                <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-900 shadow-2xl space-y-8">
                    <div className="border-b border-slate-900 pb-5 space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-green-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Sparkles size={12} /> New Marketplace Listing
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-100">Publish Agro Listing</h1>
                        <p className="text-slate-400 text-xs">Fill in specifications and attach high quality product photos.</p>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                            {error}
                        </p>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Select Product Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setProductType("seed")}
                                className={`py-4 rounded-xl border text-sm font-bold transition-all ${
                                    productType === "seed"
                                        ? "bg-green-600/10 border-green-500 text-green-500 shadow-lg shadow-green-500/5"
                                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                🌿 Seed Listing
                            </button>
                            <button
                                type="button"
                                onClick={() => setProductType("fertilizer")}
                                className={`py-4 rounded-xl border text-sm font-bold transition-all ${
                                    productType === "fertilizer"
                                        ? "bg-green-600/10 border-green-500 text-green-500 shadow-lg shadow-green-500/5"
                                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                🧪 Fertilizer Listing
                            </button>
                        </div>

                        {/* Dynamic Input Forms */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {productType === "seed" ? (
                                <>
                                    <Input
                                        label="Seed Brand/Company: *"
                                        placeholder="e.g. Mahyco, Bayer, Syngenta"
                                        {...register("seedBrand", { required: "Brand name is required" })}
                                    />
                                    <Input
                                        label="Target Crop: *"
                                        placeholder="e.g. Wheat, Basmati Rice, Cotton"
                                        {...register("cropName", { required: "Crop name is required" })}
                                    />
                                    <Input
                                        label="Germination Rate (%): *"
                                        placeholder="e.g. 90%, 95%"
                                        {...register("germinationRate", { required: "Germination rate is required" })}
                                    />
                                    <Input
                                        label="Disease Resistance: *"
                                        placeholder="e.g. High, Medium, Stem Blight resistant"
                                        {...register("diseaseResistance", { required: "Disease resistance detail is required" })}
                                    />
                                    <Input
                                        label="Price (₹): *"
                                        type="number"
                                        placeholder="Price per packet/kg"
                                        {...register("price", { required: "Price is required" })}
                                    />
                                </>
                            ) : (
                                <>
                                    <Input
                                        label="Fertilizer Name: *"
                                        placeholder="e.g. IFFCO NPK 19:19:19, Urea"
                                        {...register("fertilizerName", { required: "Fertilizer name is required" })}
                                    />
                                    <Input
                                        label="Suitable Crops: *"
                                        placeholder="e.g. Paddy, Maize, Sugarcane"
                                        {...register("suitableCrop", { required: "Suitable crops details are required" })}
                                    />
                                    <Input
                                        label="Usage / Application Method: *"
                                        placeholder="e.g. Foliar Spray, Soil Application"
                                        {...register("usageMethod", { required: "Usage details are required" })}
                                    />
                                    <Input
                                        label="Expected Outcome / Effectiveness: *"
                                        placeholder="e.g. Boosts vegetative growth"
                                        {...register("effectiveness", { required: "Effectiveness details are required" })}
                                    />
                                    <Input
                                        label="Price (₹): *"
                                        type="number"
                                        placeholder="Price per bag/bottle"
                                        {...register("price", { required: "Price is required" })}
                                    />
                                </>
                            )}
                            
                            <Select
                                label="Quality/Recommendation Rating: *"
                                options={["5", "4", "3", "2", "1"]}
                                {...register("rating", { required: true })}
                            />
                        </div>

                        {/* Common Detailed Description */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2 pl-1">
                                Full Detail & Product Description: *
                            </label>
                            <textarea
                                className="w-full px-4 py-3 min-h-[140px] rounded-xl bg-slate-950/40 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition-all text-sm leading-relaxed"
                                placeholder={`Provide complete details about dosage instructions, precautions, and packaging sizes for this ${productType}...`}
                                {...register("description", { required: "Detailed description is required" })}
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2 pl-1">
                                Product Images (Max 5):
                            </label>
                            <div className="relative border border-dashed border-slate-800 rounded-xl p-8 bg-slate-950/10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-950/20 hover:border-slate-700 transition-all duration-200">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload size={32} className="text-slate-500 mb-2" />
                                <span className="text-sm font-bold text-slate-300">
                                    {images.length > 0 ? `${images.length} files selected` : "Choose product images"}
                                </span>
                                <span className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG accepted</span>
                            </div>

                            {/* Previews */}
                            {images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {images.map((file, index) => (
                                        <span key={index} className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-full">
                                            🖼️ {file.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3.5"
                        >
                            {loading ? "Publishing Product Listing..." : "Publish Product Listing"}
                        </Button>
                    </form>
                </div>
            </Container>
        </div>
    );
}

export default UploadProduct;
