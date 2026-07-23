import type { Metadata } from "next";

import { QuestionBankManager } from "@/components/manager/programs/question-bank-manager";

export const metadata: Metadata = {
  title: "Ngân hàng câu hỏi",
};

export default function ManagerQuestionBankPage() {
  return <QuestionBankManager />;
}
