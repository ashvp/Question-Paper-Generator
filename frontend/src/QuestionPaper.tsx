import ReactMarkdown from "react-markdown";
import "./QuestionPaper.css";

export default function QuestionPaper({ markdown }: { markdown: string }) {
  return (
    <div className="question-paper">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
