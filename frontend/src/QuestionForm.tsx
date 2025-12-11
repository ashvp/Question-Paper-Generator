import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "./QuestionForm.css";

interface FormDataType {
  Standard: string;
  Subject_Name: string;
  difficulty: string;
  countOfMCQs: string | number;
  countOfShort: string | number;
  countOfLong: string | number;
  User_defined_notes: string;
}

const QuestionPaperForm: React.FC = () => {
  const [formData, setFormData] = useState<FormDataType>({
    Standard: "",
    Subject_Name: "",
    difficulty: "Medium",
    countOfMCQs: "",
    countOfShort: "",
    countOfLong: "",
    User_defined_notes: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [questionPaper, setQuestionPaper] = useState<string>("");
  const [answerKey, setAnswerKey] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.startsWith("countOf") ? Number(value) : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQuestionPaper("");
    setAnswerKey("");

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined) {
        payload.append(key, value.toString());
      }
    });
    if (file) {
      payload.append("pdf", file);
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/generate-question-paper/`,
        payload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Using backend:", import.meta.env.VITE_API_URL);
      const generatedQuestionPaper = res.data.question_paper;
      setQuestionPaper(generatedQuestionPaper);

      const answerKeyPayload = new FormData();
      answerKeyPayload.append("question_paper", generatedQuestionPaper);

      const answerKeyRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/generate-answer-key/`,
        answerKeyPayload,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setAnswerKey(answerKeyRes.data.answer_key);
    } catch (err) {
      console.error(err);
      setQuestionPaper("Failed to generate question paper.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-4"
      >
        <h1 className="display-5 fw-bold">Question Paper Generator</h1>
        <p className="text-muted">
          Create customized question papers for any subject and standard
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onSubmit={handleSubmit}
        className="card shadow p-4 mb-5"
      >
        <h4 className="mb-4">Basic Information</h4>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Standard/Class *</label>
            <input
              name="Standard"
              value={formData.Standard}
              onChange={handleChange}
              required
              placeholder="e.g., Class 10"
              className="form-control"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Subject *</label>
            <input
              name="Subject_Name"
              value={formData.Subject_Name}
              onChange={handleChange}
              required
              placeholder="e.g., Physics"
              className="form-control"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Difficulty</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="form-select"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        <h4 className="mt-5 mb-3">Question Distribution</h4>

        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Multiple Choice Questions</label>
            <input
              type="number"
              name="countOfMCQs"
              value={formData.countOfMCQs}
              onChange={handleChange}
              min="0"
              className="form-control"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Short Answer Questions</label>
            <input
              type="number"
              name="countOfShort"
              value={formData.countOfShort}
              onChange={handleChange}
              min="0"
              className="form-control"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Long Answer Questions</label>
            <input
              type="number"
              name="countOfLong"
              value={formData.countOfLong}
              onChange={handleChange}
              min="0"
              className="form-control"
            />
          </div>
        </div>

        <h4 className="mt-5 mb-3">Additional Options</h4>

        <div className="mb-3">
          <label className="form-label">Special Instructions & Notes</label>
          <textarea
            name="User_defined_notes"
            value={formData.User_defined_notes}
            onChange={handleChange}
            rows={3}
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Reference Material (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="form-control"
          />
          {file && (
            <div className="form-text mt-2 text-success">
              Uploaded: {file.name}
            </div>
          )}
        </div>

        <div className="d-grid mt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : null}
            {loading
              ? "Generating..."
              : "Generate Question Paper & Answer Key"}
          </button>
        </div>
      </motion.form>

      <AnimatePresence>
        {questionPaper && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="card shadow p-4 bg-light mb-4"
          >
            <h4 className="mb-3 text-success">Generated Question Paper</h4>
            <pre className="text-muted">{questionPaper}</pre>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {answerKey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="card shadow p-4 bg-light"
          >
            <h4 className="mb-3 text-primary">Answer Key</h4>
            <pre className="text-muted">{answerKey}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionPaperForm;