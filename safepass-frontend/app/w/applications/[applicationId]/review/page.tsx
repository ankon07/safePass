import { notFound } from "next/navigation";
import Link from "next/link";
import { getApplicationById } from "@/lib/dummy-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export default function ContractReviewPage({
  params,
}: {
  params: { applicationId: string };
}) {
  const application = getApplicationById(params.applicationId);

  if (!application) {
    notFound();
  }

  // Dynamically generate contract clauses using data from the job offer
  const contractClauses = [
    {
      title: "Salary and Compensation",
      content: `The worker shall be paid a monthly salary of ${application.job.salary}. Overtime will be paid at 1.5x the standard hourly rate as per ${application.job.country} labor law.`,
    },
    {
      title: "Working Hours & Duration",
      content: `The contract duration is for ${application.job.contractDuration}. Standard working hours are 8 hours per day, 6 days a week. Any additional hours are considered overtime.`,
    },
    {
      title: "Accommodation and Food",
      content: `The employer, ${application.job.companyName}, will provide shared, sanitary accommodation. A monthly food allowance will also be provided.`,
    },
    {
      title: "Medical Benefits",
      content:
        "Emergency medical coverage will be provided by the employer throughout the contract period.",
    },
    {
      title: "Termination Clause",
      content:
        "Either party may terminate this contract with a 30-day written notice. The employer reserves the right to immediate termination for gross misconduct.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Review Your Employment Contract
        </h1>
        <p className="text-slate-500 mt-2">
          You have received an offer for the{" "}
          <span className="font-semibold">{application.job.title}</span>{" "}
          position at{" "}
          <span className="font-semibold">{application.job.companyName}</span>.
          <br />
          Please review the terms carefully before signing.
        </p>
      </div>

      <div className="border rounded-lg p-2">
        <Accordion type="single" collapsible className="w-full">
          {contractClauses.map((clause, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-semibold hover:no-underline px-4">
                {clause.title}
              </AccordionTrigger>
              <AccordionContent className="px-4 text-slate-700 leading-relaxed">
                {clause.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
        <Button variant="outline" size="lg" asChild>
          <Link href="/w/applications">Decline Offer</Link>
        </Button>
        <Button
          size="lg"
          className="bg-viridian-green hover:bg-sage-green"
          asChild
        >
          <Link href={`/w/applications/${application.id}/sign`}>
            Accept & Sign Contract
          </Link>
        </Button>
      </div>
    </div>
  );
}
