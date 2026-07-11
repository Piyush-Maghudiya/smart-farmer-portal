import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { authService } from "../services/api";
import { login as authLogin } from "../store/authSlice";
import { Container, Input, Button, Logo } from "../components/index";

function OTPVerification() {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Retrieve email from routing state
    const email = location.state?.email || "";
    
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState(location.state?.message || "");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);

    // Resend countdown timer
    useEffect(() => {
        let interval = null;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) {
            setError("OTP must be exactly 6 digits");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const res = await authService.verifyOtp(email, otp);
            if (res.data.success) {
                const userRes = await authService.getCurrentUser();
                if (userRes.data.success) {
                    dispatch(authLogin(userRes.data.data));
                    navigate("/");
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await authService.resendOtp(email);
            if (res.data.success) {
                setMessage("A new verification code has been sent to your email.");
                setTimer(60); // Reset timer
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Failed to resend OTP");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] px-4 py-12">
            <div className="w-full max-w-md bg-slate-900/40 border border-slate-800 p-8 sm:p-10 rounded-2xl backdrop-blur-md space-y-6">
                <div className="flex justify-center">
                    <Logo />
                </div>
                
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-100">Verify Email</h2>
                    <p className="text-sm text-slate-400">
                        We have sent a 6-digit OTP code to: <br/>
                        <span className="text-green-400 font-bold break-all">{email}</span>
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

                <form onSubmit={handleVerify} className="space-y-6">
                    <Input
                        label="One-Time Password (OTP):"
                        type="text"
                        maxLength="6"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="text-center font-bold tracking-[8px] text-lg"
                    />

                    <Button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold"
                    >
                        {loading ? "Verifying..." : "Verify Code"}
                    </Button>
                </form>

                <div className="text-center pt-2">
                    <span className="text-xs text-slate-500">
                        Didn't receive the email?&nbsp;
                    </span>
                    {timer > 0 ? (
                        <span className="text-xs text-slate-400 font-semibold">
                            Resend code in {timer}s
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={resendLoading}
                            className="text-xs font-bold text-green-500 hover:text-green-400 hover:underline cursor-pointer disabled:opacity-50"
                        >
                            {resendLoading ? "Resending..." : "Resend OTP"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OTPVerification;
