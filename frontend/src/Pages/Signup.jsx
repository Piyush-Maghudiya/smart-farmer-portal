import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Input, Button, Select, Logo } from "../components/index";
import { authService } from "../services/api";
import { login as authLogin } from "../store/authSlice";
import { Upload } from "lucide-react";

function Signup() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setAvatarFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");

        if (!avatarFile) {
            setError("Avatar image is required");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("fullname", data.fullname);
        formData.append("username", data.username);
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("role", data.role || "farmer");
        formData.append("state", data.state);
        formData.append("district", data.district);
        formData.append("village", data.village);
        formData.append("phone", data.phone);
        formData.append("avatar", avatarFile);

        try {
            const signupRes = await authService.register(formData);
            if (signupRes.data.success) {
                navigate("/otp-verification", {
                    state: {
                        email: data.email,
                        message: "Account registered successfully! A 6-digit verification code has been sent to your email."
                    }
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[90vh] px-4 py-12">
            <div className="w-full max-w-2xl bg-slate-900/40 border border-slate-800 p-8 sm:p-10 rounded-2xl backdrop-blur-md">
                <div className="mb-6 flex justify-center">
                    <Logo />
                </div>
                <h2 className="text-center text-2xl font-bold text-slate-100">Create your Account</h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Already have an account?&nbsp;
                    <Link
                        to="/login"
                        className="font-bold text-green-500 hover:text-green-400 transition-colors"
                    >
                        Sign In
                    </Link>
                </p>

                {error && (
                    <p className="text-red-500 mt-6 text-sm text-center bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Input
                            label="Full Name: "
                            placeholder="Enter your full name"
                            {...register("fullname", { required: "Full name is required" })}
                        />
                        <Input
                            label="Username: "
                            placeholder="Choose username"
                            {...register("username", { required: "Username is required" })}
                        />
                        <Input
                            label="Email Address: "
                            type="email"
                            placeholder="Enter email address"
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                                    message: "Please enter a valid email address"
                                }
                            })}
                        />
                        <Input
                            label="Password: "
                            type="password"
                            placeholder="Choose secure password"
                            {...register("password", { required: "Password is required" })}
                        />
                        <Select
                            label="Community Role: "
                            options={[
                                { label: "Farmer", value: "farmer" },
                                { label: "Agricultural Expert / Admin", value: "admin" },
                                { label: "Agro Company / Seller", value: "seller" }
                            ]}
                            {...register("role")}
                        />
                        <Input
                            label="Phone Number: "
                            placeholder="e.g. +919876543210"
                            {...register("phone", { required: "Phone number is required" })}
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
                        <Input
                            label="Village: "
                            placeholder="e.g. Kila Raipur"
                            {...register("village", { required: "Village name is required" })}
                        />
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5 pl-1">
                                Profile Picture (Avatar):
                            </label>
                            <div className="relative border border-slate-800 rounded-xl p-3 bg-slate-950/20 flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-950/40 hover:border-slate-700 transition-all duration-200">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <Upload size={18} className="text-slate-400" />
                                <span className="text-sm text-slate-300 font-medium truncate">
                                    {avatarFile ? avatarFile.name : "Upload profile picture"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold mt-4"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default Signup;
