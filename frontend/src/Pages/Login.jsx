import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Input, Button, Logo } from "../components/index";
import { login as authLogin } from "../store/authSlice";
import { authService } from "../services/api";

function Login() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        setError("");
        try {
            const res = await authService.login(data.email, data.password);
            if (res.data.success) {
                if (res.data.data && (res.data.data.otpRequired || res.data.data.isVerified === false)) {
                    navigate("/otp-verification", {
                        state: {
                            email: res.data.data.email,
                            message: "A 6-digit login verification OTP has been sent to your email."
                        }
                    });
                    return;
                }

                const userRes = await authService.getCurrentUser();
                if (userRes.data.success) {
                    dispatch(authLogin(userRes.data.data));
                    navigate("/");
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
            <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-8 sm:p-10 rounded-2xl backdrop-blur-md">
                <div className="mb-6 flex justify-center">
                    <Logo />
                </div>
                <h2 className="text-center text-2xl font-bold text-slate-100">Welcome Back</h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Don't have an account?&nbsp;
                    <Link
                        to="/signup"
                        className="font-bold text-green-500 hover:text-green-400 transition-colors"
                    >
                        Sign Up
                    </Link>
                </p>

                {error && (
                    <p className="text-red-500 mt-6 text-sm text-center bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                    <Input
                        label="Email Address: "
                        type="email"
                        placeholder="Enter your registered email"
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                                message: "Please enter a valid email address"
                            }
                        })}
                    />
                    {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}

                    <Input
                        label="Password: "
                        type="password"
                        placeholder="Enter your password"
                        {...register("password", {
                            required: "Password is required"
                        })}
                    />
                    {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}

                    <div className="flex justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-xs font-semibold text-green-500 hover:text-green-400 hover:underline transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold mt-4"
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default Login;
