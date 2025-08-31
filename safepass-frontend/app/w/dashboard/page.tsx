import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BadgeCheck,
  Briefcase,
  HeartPulse,
  ShieldCheck,
  Banknote,
} from "lucide-react";
import { format } from "date-fns";

// DUMMY DATA for Verifiable Credentials
const credentials = [
  {
    title: "Verified Passport",
    issuer: "Govt. of Bangladesh",
    issueDate: new Date(2025, 7, 29),
    icon: <ShieldCheck className="h-8 w-8 text-viridian-green" />,
  },
  {
    title: "National ID (NID)",
    issuer: "Govt. of Bangladesh",
    issueDate: new Date(2025, 7, 29),
    icon: <BadgeCheck className="h-8 w-8 text-viridian-green" />,
  },
  {
    title: "Medical Clearance",
    issuer: "Dhaka Central Hospital",
    issueDate: new Date(2025, 8, 20),
    icon: <HeartPulse className="h-8 w-8 text-viridian-green" />,
  },
  {
    title: "Certified Welder",
    issuer: "BMET Training Center",
    issueDate: new Date(2025, 7, 15),
    icon: <Briefcase className="h-8 w-8 text-viridian-green" />,
  },
  {
    title: "Bank Account Verified",
    issuer: "Sonali Bank",
    issueDate: new Date(2025, 6, 5),
    icon: <Banknote className="h-8 w-8 text-viridian-green" />,
  },
];

export default function VcDashboardPage() {
  const workerName = "Karim Ahmed"; // In a real app, this would come from the user session

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Welcome back, {workerName}!
        </h1>
        <p className="text-slate-500">
          This is your secure digital portfolio. Share credentials with trusted
          employers with a single tap.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {credentials.map((cred) => (
          <Card key={cred.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                {cred.icon}
                <Badge variant="secondary">Verified</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg text-dark-jungle-green">
                {cred.title}
              </CardTitle>
              <CardDescription className="mt-1">
                Issued by: {cred.issuer}
              </CardDescription>
              <p className="text-xs text-slate-400 mt-4">
                Issued on: {format(cred.issueDate, "PPP")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
