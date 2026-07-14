import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { questionService, answerService } from "../services/api";
import { Container } from "../components/index";
import { MessageSquare, Heart, Eye, Trash2, Calendar, User, ChevronLeft, Send, Award, Leaf, AlertCircle, CheckCircle2, ThumbsUp, Clock } from "lucide-react";

const ROLE_BADGES = {
    farmer: { label: "Farmer", color: "text-green-400 bg-green-500/10 border-green-500/20" },
    expert: { label: "Expert", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    seller: { label: "Seller", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    admin: { label: "Admin", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
};

function RoleBadge({ role }) {
    const badge = ROLE_BADGES[role?.toLowerCase()] || { label: role || "Member", color: "text-slate-400 bg-slate-700/30 border-slate-700" };
    return (
        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${badge.color}`}>
            {badge.label}
        </span>
    );
}

const SIZE_CLASSES = {
    6: "w-6 h-6 text-[10px]",
    7: "w-7 h-7 text-xs",
    8: "w-8 h-8 text-xs",
    9: "w-9 h-9 text-sm",
    10: "w-10 h-10 text-base",
    12: "w-12 h-12 text-lg",
    16: "w-16 h-16 text-xl",
};

function UserAvatar({ user, size = 10 }) {
    const sizeClass = SIZE_CLASSES[size] || "w-10 h-10 text-base";
    if (user?.avatar?.url) {
        return <img src={user.avatar.url} alt={user.fullname} className={`${sizeClass} rounded-full object-cover ring-2 ring-slate-700`} />;
    }
    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center font-bold text-white ring-2 ring-slate-700`}>
            {user?.fullname?.charAt(0)?.toUpperCase() || "?"}
        </div>
    );
}

const MAX_ANSWER_LENGTH = 2000;

function QuestionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { status: authStatus, userData } = useSelector((state) => state.auth);

    const [question, setQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [newAnswer, setNewAnswer] = useState("");
    const [loading, setLoading] = useState(true);
    const [submittingAnswer, setSubmittingAnswer] = useState(false);
    const [error, setError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [likeLoading, setLikeLoading] = useState(null);

    const fetchQuestionDetails = async () => {
        try {
            const res = await questionService.getById(id);
            if (res.data.success) {
                setQuestion(res.data.data.question);
                setAnswers(res.data.data.answers || []);
            }
        } catch (err) {
            setError("Failed to load question details");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuestionDetails(); }, [id]);

    const handleQuestionLike = async () => {
        if (!authStatus) { navigate("/login"); return; }
        try {
            const res = await questionService.toggleLike(id);
            if (res.data.success) {
                const isLiked = res.data.data.isLiked;
                setQuestion((prev) => ({ ...prev, isLiked, likesCount: prev.likesCount + (isLiked ? 1 : -1) }));
            }
        } catch (err) { console.error("Liking question failed:", err); }
    };

    const handleAnswerLike = async (answerId) => {
        if (!authStatus) { navigate("/login"); return; }
        setLikeLoading(answerId);
        try {
            const res = await answerService.toggleLike(answerId);
            if (res.data.success) {
                const isLiked = res.data.data.isLiked;
                setAnswers(answers.map((ans) =>
                    ans._id === answerId
                        ? { ...ans, isLiked, likesCount: ans.likesCount + (isLiked ? 1 : -1) }
                        : ans
                ));
            }
        } catch (err) { console.error("Liking answer failed:", err); }
        finally { setLikeLoading(null); }
    };

    const handlePostAnswer = async (e) => {
        e.preventDefault();
        if (!newAnswer.trim()) return;
        setSubmittingAnswer(true);
        setSubmitSuccess(false);
        try {
            const res = await answerService.create(id, newAnswer.trim());
            if (res.data.success) {
                setNewAnswer("");
                setSubmitSuccess(true);
                await fetchQuestionDetails();
                setTimeout(() => setSubmitSuccess(false), 3500);
            }
        } catch (err) { console.error("Failed to post answer:", err); }
        finally { setSubmittingAnswer(false); }
    };

    const handleDeleteQuestion = async () => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        try { await questionService.delete(id); navigate("/qa"); }
        catch (err) { console.error("Failed to delete question:", err); }
    };

    const handleDeleteAnswer = async (answerId) => {
        if (!window.confirm("Are you sure you want to delete this answer?")) return;
        try {
            await answerService.delete(answerId);
            setAnswers(answers.filter((a) => a._id !== answerId));
        } catch (err) { console.error("Failed to delete answer:", err); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
                <div className="w-10 h-10 border-[3px] border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm animate-pulse">Loading question...</p>
            </div>
        );
    }

    if (error || !question) {
        return (
            <Container className="py-20 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 text-base mb-4">{error || "Question not found"}</p>
                <Link to="/qa" className="text-green-500 font-bold hover:underline">← Back to Forum</Link>
            </Container>
        );
    }

    const isQuestionOwner = userData && question.ownerDetails?._id === userData._id;
    const isAdmin = userData && userData.role === "admin";
    const dateFormatted = new Date(question.createdAt).toLocaleDateString("en-IN", {
        year: "numeric", month: "long", day: "numeric"
    });
    const charCount = newAnswer.length;
    const charLeft = MAX_ANSWER_LENGTH - charCount;
    const isOverLimit = charCount > MAX_ANSWER_LENGTH;

    return (
        <div className="py-10 min-h-screen">
            <Container className="max-w-4xl space-y-8">

                {/* Back Link */}
                <Link to="/qa" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-green-400 transition-colors group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Q&amp;A Forum
                </Link>

                {/* ── Question Card ── */}
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">
                                {question.cropCategory}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                <Eye size={11} /> {question.views || 0} views
                            </span>
                        </div>
                        {(isQuestionOwner || isAdmin) && (
                            <button onClick={handleDeleteQuestion} className="text-slate-500 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer" title="Delete Question">
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-snug">{question.title}</h1>

                    <div className="flex items-center gap-3">
                        <UserAvatar user={question.ownerDetails} size={9} />
                        <div>
                            <p className="text-sm font-bold text-slate-200">{question.ownerDetails?.fullname || "Farmer"}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <RoleBadge role={question.ownerDetails?.role} />
                                <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10} /> {dateFormatted}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-800/40">
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{question.description}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-800/40">
                        <button onClick={handleQuestionLike} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${question.isLiked ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600"}`}>
                            <Heart size={13} className={question.isLiked ? "fill-red-400" : ""} />
                            {question.isLiked ? "Liked" : "Like"} · {question.likesCount || 0}
                        </button>
                        <span className="text-xs text-slate-600">{answers.length} answer{answers.length !== 1 ? "s" : ""}</span>
                    </div>
                </div>

                {/* ── Answers Section ── */}
                <div className="space-y-5">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
                        <MessageSquare size={19} className="text-green-500" />
                        Answers from the Community
                        {answers.length > 0 && (
                            <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                {answers.length} answer{answers.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </h2>

                    {answers.length > 0 ? (
                        <div className="space-y-4">
                            {answers.map((ans, idx) => {
                                const isAnsOwner = userData && ans.ownerDetails?._id === userData._id;
                                const isTopAnswer = idx === 0 && answers.length > 1 && (ans.likesCount || 0) > 0;
                                return (
                                    <div key={ans._id} className={`rounded-2xl p-5 sm:p-6 space-y-4 border transition-all ${isTopAnswer ? "bg-green-900/10 border-green-500/20 shadow-lg shadow-green-900/10" : "bg-slate-900/20 border-slate-800/60 hover:border-slate-700/60"}`}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <UserAvatar user={ans.ownerDetails} size={9} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-sm font-bold text-slate-200">{ans.ownerDetails?.fullname || "Community Member"}</h5>
                                                        {isTopAnswer && (
                                                            <span className="text-[9px] font-bold text-green-400 flex items-center gap-0.5">
                                                                <Award size={10} /> Top Answer
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <RoleBadge role={ans.ownerDetails?.role} />
                                                        <span className="text-[9px] text-slate-600 flex items-center gap-1">
                                                            <Clock size={9} />
                                                            {new Date(ans.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {(isAnsOwner || isAdmin) && (
                                                <button onClick={() => handleDeleteAnswer(ans._id)} className="text-slate-600 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer shrink-0" title="Delete Answer">
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>

                                        <div className="pl-12">
                                            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{ans.answer}</p>
                                        </div>

                                        <div className="pl-12 flex items-center gap-3 pt-2 border-t border-slate-800/30">
                                            <button
                                                onClick={() => handleAnswerLike(ans._id)}
                                                disabled={likeLoading === ans._id}
                                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${ans.isLiked ? "bg-green-500/10 border-green-500/20 text-green-400" : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}
                                            >
                                                <ThumbsUp size={12} className={ans.isLiked ? "fill-green-400" : ""} />
                                                Helpful · {ans.likesCount || 0}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800">
                            <Leaf className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm font-semibold">No answers yet</p>
                            <p className="text-slate-600 text-xs mt-1">Be the first farmer to help out!</p>
                        </div>
                    )}
                </div>

                {/* ── Post Answer Form ── */}
                <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/20 border border-slate-800/60 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                            <Send size={15} className="text-green-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-100">Share Your Knowledge</h3>
                            <p className="text-[11px] text-slate-500">Help fellow farmers with your experience and expertise</p>
                        </div>
                    </div>

                    {authStatus ? (
                        <form onSubmit={handlePostAnswer} className="space-y-4">
                            {userData && (
                                <div className="flex items-center gap-2.5 text-sm text-slate-400 bg-slate-900/40 rounded-xl px-3 py-2 border border-slate-800/40">
                                    <UserAvatar user={userData} size={7} />
                                    <span>Answering as <strong className="text-slate-200">{userData.fullname}</strong></span>
                                    <RoleBadge role={userData.role} />
                                </div>
                            )}

                            {submitSuccess && (
                                <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                                    <CheckCircle2 size={16} />
                                    Your answer has been posted successfully!
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-300 pl-1">Your Answer / Solution:</label>
                                <textarea
                                    className={`w-full px-4 py-3 min-h-[150px] rounded-xl bg-slate-900/60 border text-slate-100 placeholder-slate-600 outline-none transition-all duration-200 text-sm leading-relaxed resize-y ${isOverLimit ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-slate-800 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"}`}
                                    placeholder="Share your farming experience, tips, or solution clearly. The more detail you provide, the more helpful your answer will be to the community..."
                                    value={newAnswer}
                                    onChange={(e) => setNewAnswer(e.target.value)}
                                    required
                                />
                                <div className="flex justify-end">
                                    <span className={`text-[11px] font-mono ${isOverLimit ? "text-red-500" : charLeft < 100 ? "text-amber-500" : "text-slate-600"}`}>
                                        {charCount}/{MAX_ANSWER_LENGTH}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submittingAnswer || !newAnswer.trim() || isOverLimit}
                                className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl font-bold text-sm bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20 cursor-pointer"
                            >
                                {submittingAnswer ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Posting Answer...
                                    </>
                                ) : (
                                    <>
                                        <Send size={15} />
                                        Post Your Answer
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/40 rounded-xl border border-slate-800/60 px-5 py-4">
                            <div className="flex items-center gap-3 text-sm text-slate-400">
                                <User size={16} className="text-slate-500 shrink-0" />
                                <span>Sign in to share your farming knowledge and help this farmer.</span>
                            </div>
                            <Link to="/login" className="shrink-0 px-5 py-2 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-500 text-white transition-all">
                                Sign In to Answer
                            </Link>
                        </div>
                    )}
                </div>

            </Container>
        </div>
    );
}

export default QuestionDetail;
