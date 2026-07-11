import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { questionService } from "../services/api";
import { Container, Button, Input, Select } from "../components/index";
import { HelpCircle, MessageSquare, Eye, Search, Plus } from "lucide-react";

function QA() {
    const navigate = useNavigate();
    const { status: authStatus } = useSelector((state) => state.auth);

    const [questions, setQuestions] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Question formulation
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [cropCategory, setCropCategory] = useState("General");
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    // Search and filter
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 10,
                cropCategory: selectedCategory || undefined,
                q: searchQuery || undefined
            };
            const res = await questionService.getAll(params);
            if (res.data.success) {
                setQuestions(res.data.data.docs || res.data.data || []);
                setTotalPages(res.data.data.totalPages || 1);
            }
        } catch (err) {
            console.error("Failed to load questions:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [page, selectedCategory]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchQuestions();
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setFormError("Title and description are required");
            return;
        }

        setFormLoading(true);
        setFormError("");
        try {
            const res = await questionService.create({
                title: title.trim(),
                description: description.trim(),
                cropCategory: cropCategory.trim()
            });

            if (res.data.success) {
                setTitle("");
                setDescription("");
                setCropCategory("General");
                setShowForm(false);
                setPage(1);
                fetchQuestions();
            }
        } catch (err) {
            setFormError(err.response?.data?.message || "Failed to post question");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="py-12">
            <Container className="space-y-8">
                {/* Header Title Section */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Community Q&A Forum</h1>
                        <p className="text-slate-400 text-sm mt-1">Ask questions, share agricultural troubleshooting tips, and get advice from experts.</p>
                    </div>
                    {authStatus && (
                        <Button
                            onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 font-bold"
                        >
                            <Plus size={16} /> {showForm ? "Close Panel" : "Ask a Question"}
                        </Button>
                    )}
                </div>

                {/* Inline Question Submission Form */}
                {showForm && (
                    <form onSubmit={handleAskQuestion} className="bg-slate-900/40 p-6 sm:p-8 rounded-2xl border border-slate-800/80 space-y-4">
                        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            <HelpCircle size={20} className="text-green-500" /> What is your farming question?
                        </h3>
                        {formError && <p className="text-red-500 text-sm">{formError}</p>}
                        
                        <Input
                            label="Question Title / Subject:"
                            placeholder="e.g. Yellowing of wheat leaves after irrigation"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Select
                                label="Crop Category:"
                                options={["General", "Rice", "Wheat", "Maize", "Potato", "Cotton", "Sugarcane", "Pulses", "Vegetables"]}
                                value={cropCategory}
                                onChange={(e) => setCropCategory(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-1.5 pl-1">
                                Explain in detail:
                            </label>
                            <textarea
                                className="w-full px-4 py-2.5 min-h-[100px] rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-200"
                                placeholder="Describe the symptoms, soil, crop stage, and any inputs you have already used..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <Button type="submit" disabled={formLoading} className="w-full bg-green-600 hover:bg-green-500 font-bold">
                            {formLoading ? "Posting..." : "Post Question"}
                        </Button>
                    </form>
                )}

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <form onSubmit={handleSearch} className="md:col-span-2 flex gap-3">
                        <Input
                            placeholder="Search questions by keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="bg-slate-900 border border-slate-800 px-5 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                            <Search size={18} />
                        </button>
                    </form>

                    <Select
                        options={[
                            { label: "All Categories", value: "" },
                            { label: "General Questions", value: "General" },
                            { label: "Rice", value: "Rice" },
                            { label: "Wheat", value: "Wheat" },
                            { label: "Maize", value: "Maize" },
                            { label: "Potato", value: "Potato" },
                            { label: "Cotton", value: "Cotton" },
                            { label: "Sugarcane", value: "Sugarcane" },
                            { label: "Vegetables", value: "Vegetables" }
                        ]}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                </div>

                {/* Questions Listing */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl border border-slate-900/60 shimmer" />
                        ))}
                    </div>
                ) : questions.length > 0 ? (
                    <div className="space-y-4">
                        {questions.map((q) => (
                            <div key={q._id} className="bg-slate-900/30 border border-slate-800/80 p-6 rounded-2xl hover:border-green-500/30 hover:shadow-lg transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded">
                                        {q.cropCategory}
                                    </span>
                                    <Link to={`/qa/${q._id}`}>
                                        <h3 className="text-base font-bold text-slate-100 hover:text-green-400 transition-colors line-clamp-1">
                                            {q.title}
                                        </h3>
                                    </Link>
                                    <p className="text-slate-400 text-xs line-clamp-2">{q.description}</p>
                                    
                                    <div className="flex gap-4 text-xs text-slate-500 pt-1">
                                        <span className="font-semibold">By: {q.ownerDetails?.fullname || "Farmer"}</span>
                                        <span>• {new Date(q.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 text-xs text-slate-400 shrink-0">
                                    <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/50">
                                        <MessageSquare size={13} className="text-green-500" />
                                        {q.answersCount || 0} Answers
                                    </span>
                                    <span className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/50">
                                        <Eye size={13} className="text-slate-500" />
                                        {q.views || 0} Views
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-slate-900/60">
                        <p className="text-slate-400 text-sm">No questions found in this category.</p>
                    </div>
                )}
            </Container>
        </div>
    );
}

export default QA;
