import mongoose from "mongoose"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"
import User from "../models/user.models.js"
import { uploadoncloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"
import ApiResponse from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

const generateAccesstokenAndRefreshtoken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccesstoken();
        const refreshToken = user.generateRefreshtoken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong when generating refresh and access tokens");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, password, username, role, state, district, village, phone } = req.body || {};

    if (!fullname || !email || !password || !username || !state || !district || !village || !phone) {
        throw new ApiError(400, "All fields are required (fullname, email, password, username, state, district, village, phone)");
    }

    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existedUser) {
        throw new ApiError(409, "Username or email already exists");
    }

    // Access avatar path from req.file or req.files
    const avatarlocalpath = req.file?.path || req.files?.avatar?.[0]?.path;
    if (!avatarlocalpath) {
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadoncloudinary(avatarlocalpath);
    if (!avatar) {
        throw new ApiError(400, "Avatar upload failed");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    const user = await User.create({
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        fullname,
        password,
        role: role || "farmer",
        state,
        district,
        village,
        phone,
        isVerified: false,
        otp,
        otpExpiry,
        avatar: {
            url: avatar.url,
            public_id: avatar.public_id
        }
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken -otp -otpExpiry");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating the user");
    }

    // Send the email OTP
    await sendEmail(createdUser.email, "Smart Farmer - Email OTP Verification", otp);

    return res.status(201).json(
        new ApiResponse(201, { user: createdUser, email: createdUser.email }, "User registered successfully. OTP sent to your email.")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [{ username: username?.toLowerCase() }, { email: email?.toLowerCase() }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.passwordcorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate OTP for login
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save({ validateBeforeSave: false });

    await sendEmail(user.email, "Smart Farmer - Login OTP Verification", otp);

    return res.status(200).json(
        new ApiResponse(200, { otpRequired: true, email: user.email }, "A 6-digit login verification OTP has been sent to your email.")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccesstokenAndRefreshtoken(user._id);

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken
                    },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const changepassword = asyncHandler(async (req, res) => {
    const { oldpassword, newpassword, confpassword } = req.body;

    if (!oldpassword || !newpassword || !confpassword) {
        throw new ApiError(400, "All password fields are required");
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.passwordcorrect(oldpassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    if (newpassword !== confpassword) {
        throw new ApiError(400, "New password and confirmation password do not match");
    }

    user.password = newpassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getcurrentuser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccount = asyncHandler(async (req, res) => {
    const { fullname, email, state, district, village, phone } = req.body;

    if (!fullname || !email || !state || !district || !village || !phone) {
        throw new ApiError(400, "All fields are required for profile updates");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email.toLowerCase().trim(),
                state,
                district,
                village,
                phone
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.findById(req.user._id).select("avatar");
    const avatar = await uploadoncloudinary(avatarLocalPath);

    if (!avatar?.url) {
        throw new ApiError(500, "Error uploading avatar to cloud storage");
    }

    const oldAvatarPublicId = user?.avatar?.public_id;

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: {
                    url: avatar.url,
                    public_id: avatar.public_id
                }
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        throw new ApiError(500, "Error saving new avatar path to database");
    }

    if (oldAvatarPublicId) {
        await deleteFromCloudinary(oldAvatarPublicId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.otp !== otp) {
        throw new ApiError(400, "Invalid OTP code");
    }

    if (new Date() > user.otpExpiry) {
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate tokens to log them in automatically
    const { accessToken, refreshToken } = await generateAccesstokenAndRefreshtoken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "Email verified and user logged in successfully"
            )
        );
});

const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save({ validateBeforeSave: false });

    await sendEmail(user.email, "Smart Farmer - OTP Verification", otp);

    return res
        .status(200)
        .json(new ApiResponse(200, { email: user.email }, "Verification OTP resent successfully"));
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        throw new ApiError(404, "User with this email does not exist");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await user.save({ validateBeforeSave: false });

    await sendEmail(user.email, "Smart Farmer - Password Reset OTP", otp);

    return res
        .status(200)
        .json(new ApiResponse(200, { email: user.email }, "Password reset OTP has been sent to your email."));
});

const forgotPasswordReset = asyncHandler(async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields (email, otp, newPassword, confirmPassword) are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "Passwords do not match");
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (user.otp !== otp) {
        throw new ApiError(400, "Invalid OTP code");
    }

    if (new Date() > user.otpExpiry) {
        throw new ApiError(400, "OTP has expired. Please request a new one.");
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password has been reset successfully. Please log in with your new password."));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changepassword,
    getcurrentuser,
    updateAccount,
    updateAvatar,
    verifyOtp,
    resendOtp,
    forgotPasswordRequest,
    forgotPasswordReset
};
