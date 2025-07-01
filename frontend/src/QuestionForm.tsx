import { useState, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

type FormDataType = {
    Standard: string;
    Subject_Name: string;
    difficulty: string;
    countOfMCQs: number;
    countOfShort: number;
    countOfLong: number;
    User_defined_notes?: string
}

const QuestionForm = () => {
  const [formData, setFormData] = useState<FormDataType>({
    Standard: "",
    Subject_Name: "",
    difficulty: "Medium",
    countOfMCQs: 5,
    countOfShort: 3,
    countOfLong: 2,
    User_defined_notes: "",
  });

  const [pdf, setPdf] = useState<File | null>(null);
  const [response, setResponse] = useState<string>("");

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name.startsWith("countOf") && value !== ""
          ? Number(value)
          : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdf(e.target.files[0]);
    }
  };

    const handleSubmit = async (e: FormEvent) => {
        console.log("Button Clicked")
        console.log(formData)
    e.preventDefault();
    const payload = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined) {
        payload.append(key, value.toString());
      }
    });

    if (pdf) {
      payload.append("pdf", pdf);
    }

    try {
      const res = await axios.post(
        "http://localhost:9000/generate-question-paper/",
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
    <div className="p-4 max-w-xl mx-auto">
          <h1 className="text-xl font-bold mb-4">Generate Question Paper</h1>
          <table>
              <form onSubmit={handleSubmit} className="space-y-4">
                  <tr>
              <td><label className="block text-sm font-medium mb-2">Enter Standard:</label></td>
        <td><input
          name="Standard"
          placeholder="Class/Standard"
          value={formData.Standard}
          onChange={handleChange}
          required
          className="border p-2 w-full"
              /></td>
              </tr>
              <br></br>
                  <tr>
                      <td>
                          <label className="block text-sm font-medium mb-2">Enter Subject:</label>
                      </td>
                <td>
        <input
          name="Subject_Name"
          placeholder="Subject"
          value={formData.Subject_Name}
          onChange={handleChange}
          required
          className="border p-2 w-full"
                          />
                      </td>
                </tr>
              <br></br>
              <tr><td>
                  <label className="block text-sm font-medium mb-2">Select Difficulty:</label></td><td>
        <select
          name="difficulty"
          value={formData.difficulty}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
              </select></td></tr>
                  <br></br>
                  <tr>
                      
                  <td>
                          <label className="block text-sm font-medium mb-2">Number of MCQs:</label>
                          </td>
        <td><input
          name="countOfMCQs"
          type="number"
          value={formData.countOfMCQs}
          onChange={handleChange}
          className="border p-2 w-full"
                      />
                      </td> </tr>
                          <br></br>
                          <tr><td>
              <label className="block text-sm font-medium mb-2">Number of Short Answer Questions:</label></td>
        <td><input
          name="countOfShort"
          type="number"
          value={formData.countOfShort}
          onChange={handleChange}
          className="border p-2 w-full"
              /></td></tr>
                  <br></br>
                  <tr><td>
              <label className="block text-sm font-medium mb-2">Number of Long Answer Questions:</label></td>
        <td><input
          name="countOfLong"
          type="number"
          value={formData.countOfLong}
          onChange={handleChange}
          className="border p-2 w-full"
              /></td></tr>
                  <br></br>
                  <tr><td>
              <label className="block text-sm font-medium mb-2">User Defined Notes: (Optional)</label></td>
        <td><textarea
          name="User_defined_notes"
          placeholder="Extra notes"
          value={formData.User_defined_notes}
          onChange={handleChange}
          className="border p-2 w-full"
              /></td></tr>
                  <br></br>
                  <tr><td>
              <label className="block text-sm font-medium mb-2">Upload PDF:</label></td>
        <td><input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="border p-2 w-full"
              /></td></tr>
              <br></br>
              <br></br>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Generate
        </button>
              </form>
        </table>

      {response && (
        <div className="mt-6 whitespace-pre-wrap border p-4 bg-gray-100">
          <h2 className="text-lg font-bold mb-2">Output:</h2>
          <div className="bg-gray-100 p-4 rounded">
          <ReactMarkdown>
            {response}
          </ReactMarkdown>
        </div>
        </div>
      )}
    </div>
  );
};

export default QuestionForm;