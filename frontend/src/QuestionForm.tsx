import React, { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import axios from "axios";

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
  const [response, setResponse] = useState<string>("");

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
    setResponse("loading");

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
      setResponse(res.data.question_paper);
    } catch (err) {
      console.error(err);
      setResponse("Failed to generate question paper.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Question Paper Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Create customized question papers for any subject and standard
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <h2 className="text-2xl font-semibold text-white">Paper Configuration</h2>
            <p className="text-blue-100 mt-1">
              Fill in the details below to generate your question paper
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Standard/Class <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="Standard"
                      value={formData.Standard}
                      onChange={handleChange}
                      placeholder="e.g., Class 10, Grade 12"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="Subject_Name"
                      value={formData.Subject_Name}
                      onChange={handleChange}
                      placeholder="e.g., Biology, Physics"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Difficulty Level
                    </label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Question Count */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Question Distribution
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Multiple Choice Questions
                    </label>
                    <input
                      type="number"
                      name="countOfMCQs"
                      value={formData.countOfMCQs}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Short Answer Questions
                    </label>
                    <input
                      type="number"
                      name="countOfShort"
                      value={formData.countOfShort}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Long Answer Questions
                    </label>
                    <input
                      type="number"
                      name="countOfLong"
                      value={formData.countOfLong}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Notes and File Upload */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Additional Options
                </h3>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Special Instructions & Notes
                  </label>
                  <textarea
                    name="User_defined_notes"
                    value={formData.User_defined_notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Any specific topics to focus on or instructions..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-200 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Reference Material (PDF)
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF files only</p>
                      </div>
                      <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                  {file && (
                    <div className="flex items-center mt-2 text-sm text-green-700 bg-green-100 p-2 rounded">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>File uploaded: {file.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={response === "loading"}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
                >
                  {response === "loading" ? (
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Generating Questions...</span>
                    </div>
                  ) : (
                    "Generate Question Paper"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Output */}
        {response && response !== "loading" && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-8 py-6">
              <h2 className="text-2xl font-semibold text-white">Generated Question Paper</h2>
              <p className="text-green-100 mt-1">Your customized question paper is ready</p>
            </div>
            <div className="p-8">
              <div className="bg-gray-50 rounded-lg p-6 border">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                  {response}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPaperForm;
