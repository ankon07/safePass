import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { faqItems } from "@/lib/dummy-data";
import { Mail, Phone } from "lucide-react";

export default function HelpSupportPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Help & Support
        </h1>
        <p className="text-slate-500">
          Find answers to your questions and get help when you need it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* FAQ Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4 text-dark-jungle-green">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-700 leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact Support Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                If you can&apos;t find the answer you&apos;re looking for,
                please contact our support team or a partner NGO.
              </p>
              <div>
                <a
                  href="mailto:support@safepass.gov"
                  className="flex items-center gap-3 group"
                >
                  <Mail className="h-5 w-5 text-sage-green" />
                  <span className="font-medium group-hover:underline">
                    Email Support
                  </span>
                </a>
              </div>
              <div>
                <a
                  href="tel:+880123456789"
                  className="flex items-center gap-3 group"
                >
                  <Phone className="h-5 w-5 text-sage-green" />
                  <span className="font-medium group-hover:underline">
                    Support Hotline
                  </span>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
