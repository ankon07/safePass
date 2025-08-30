import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrustScoreChart } from "@/components/charts/trust-score-chart";

// DUMMY DATA
const events = [
  {
    description: "Successful placement of Worker #456",
    impact: "+5.0",
    date: "Aug 28, 2025",
  },
  {
    description: "Contract signed for Job #123",
    impact: "+1.0",
    date: "Aug 25, 2025",
  },
  {
    description: "Verified complaint #789 filed",
    impact: "-20.0",
    date: "Aug 22, 2025",
  },
  {
    description: "Successful placement of Worker #455",
    impact: "+5.0",
    date: "Aug 20, 2025",
  },
];

export default function TrustScoreDetailsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark-jungle-green">
          Trust Score Details
        </h1>
        <p className="text-slate-500">
          An overview of your on-chain reputation and recent events.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Score History (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrustScoreChart />
          </CardContent>
        </Card>

        {/* Event Log */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Actions that have recently impacted your score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.description}>
                    <TableCell className="font-medium">
                      {event.description}
                    </TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell
                      className={`text-right font-bold ${
                        event.impact.startsWith("+")
                          ? "text-viridian-green"
                          : "text-red-600"
                      }`}
                    >
                      {event.impact}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
