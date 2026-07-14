import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Input, Button, Logo } from "../components/index";
import { authService } from "../services/api";

function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: request OTP, 2: reset password
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Form hooks for Step 1 (Request)
    const { 
        register: registerRequest, 
        handleSubmit: handleSubmitRequest, 
        formState: { errors: errorsRequest } 
    } = useForm();

    // Form hooks for Step 2 (Reset)
    const { 
        register: registerReset, 
        handleSubmit: handleSubmitReset, 
        formState: { errors: errorsReset },
        watch: watchReset 
    } = useForm();

    const onRequestSubmit = async (data) => {
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await authService.forgotPasswordRequest(data.email);
            if (res.data.success) {
                setEmail(data.email);
                setMessage(res.data.message || "Reset OTP sent to your email.");
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to request password reset");
        } finally {
            setLoading(false);
        }
    };

    const onResetSubmit = async (data) => {
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await authService.forgotPasswordReset(
                email, 
                data.otp, 
                data.newPassword, 
                data.confirmPassword
            );
            if (res.data.success) {
                // Success! Redirect to login after 3 seconds or immediately.
                setMessage("Password reset successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
            <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-8 sm:p-10 rounded-2xl backdrop-blur-md space-y-6">
                <div className="flex justify-center">
                    <Logo />
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-100">Reset Password</h2>
                    <p className="text-sm text-slate-400">
                        {step === 1 
                            ? "Enter your registered email to receive a password reset OTP code." 
                            : "Enter the OTP code sent to your email and your new password."
                        }
                    </p>
                </div>

                {error && (
                    <p className="text-red-500 text-xs text-center bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
                        {error}
                    </p>
                )}

                {message && (
                    <p className="text-green-400 text-xs text-center bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">
                        {message}
                    </p>
                )}

                {step === 1 ? (
                    <form onSubmit={handleSubmitRequest(onRequestSubmit)} className="space-y-5">
                        <Input
                            label="Email Address:"
                            type="email"
                            placeholder="Enter your registered email"
                            {...registerRequest("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                                    message: "Please enter a valid email address"
                                }
                            })}
                        />
                        {errorsRequest.email && (
                            <span className="text-xs text-red-500">{errorsRequest.email.message}</span>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold"
                        >
                            {loading ? "Sending Code..." : "Send Reset Code"}
                        </Button>

                        <div className="text-center pt-2">
                            <Link to="/login" className="text-xs font-bold text-green-500 hover:text-green-400 transition-colors">
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-5">
                        <Input
                            label="Verification Code (OTP):"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            maxLength="6"
                            {...registerReset("otp", {
                                required: "OTP is required",
                                length: { value: 6, message: "OTP must be exactly 6 digits" }
                            })}
                        />
                        {errorsReset.otp && (
                            <span className="text-xs text-red-500">{errorsReset.otp.message}</span>
                        )}

                        <Input
                            label="New Password:"
                            type="password"
                            placeholder="Enter new password"
                            {...registerReset("newPassword", {
                                required: "New password is required",
                                minLength: { value: 6, message: "Password must be at least 6 characters" }
                            })}
                        />
                        {errorsReset.newPassword && (
                            <span className="text-xs text-red-500">{errorsReset.newPassword.message}</span>
                        )}

                        <Input
                            label="Confirm New Password:"
                            type="password"
                            placeholder="Confirm new password"
                            {...registerReset("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (val) => {
                                    if (watchReset('newPassword') !== val) {
                                        return "Passwords do not match";
                                    }
                                }
                            })}
                        />
                        {errorsReset.confirmPassword && (
                            <span className="text-xs text-red-500">{errorsReset.confirmPassword.message}</span>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold"
                        >
                            {loading ? "Resetting..." : "Reset Password"}
                        </Button>

                        <div className="text-center pt-2 flex justify-between items-center text-xs">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="font-bold text-slate-400 hover:text-slate-300 transition-colors"
                            >
                                Change Email
                            </button>
                            <Link to="/login" className="font-bold text-green-500 hover:text-green-400 transition-colors">
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
