import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, Phone } from "lucide-react";

// DUMMY DATA
const candidate = {
  id: "c1",
  name: "Rahim Islam",
  avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  appliedFor: "Senior Welder",
  credentials: [
    "Passport Verified",
    "Welder Cert. Verified",
    "Medical Clearance",
  ],
  activity: [
    { status: "Credentials Verified", date: "Aug 27, 2025" },
    { status: "Application Received", date: "Aug 26, 2025" },
  ],
};

export default function CandidateDetailsPage({
  params,
}: {
  params: { candidateId: string };
}) {
  return (
    <div className="p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={candidate.avatar} />
                <AvatarFallback>
                  {candidate.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold">{candidate.name}</h1>
              <p className="text-slate-500">
                Applied for: {candidate.appliedFor}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Verifiable Credentials</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {candidate.credentials.map((cred) => (
                <Badge
                  key={cred}
                  className="bg-light-grayish-green text-dark-jungle-green"
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-viridian-green" />
                  {cred}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity & Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <ul>
                {candidate.activity.map((item) => (
                  <li key={item.status} className="flex gap-4 mb-4 last:mb-0">
                    <div className="flex flex-col items-center">
                      <div className="bg-viridian-green rounded-full h-8 w-8 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="w-px h-full bg-slate-200"></div>
                    </div>
                    <div>
                      <p className="font-medium">{item.status}</p>
                      <p className="text-sm text-slate-500">{item.date}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
