import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgencyById } from "@/lib/dummy-data";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

// A small component to render star ratings
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
        }`}
      />
    ))}
  </div>
);

export default function AgencyProfilePage({
  params,
}: {
  params: { agencyId: string };
}) {
  const agency = getAgencyById(params.agencyId);

  if (!agency) {
    notFound();
  }

  const trustScorePercentage = (agency.trustScore * 100).toFixed(0);

  return (
    <div>
      <Link
        href="/w/jobs"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-dark-jungle-green mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>

      {/* Agency Header */}
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Avatar className="w-24 h-24 border">
          <AvatarImage
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${agency.name}`}
          />
          <AvatarFallback>{agency.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-dark-jungle-green">
            {agency.name}
          </h1>
          <p className="text-slate-500">Licensed by BMET</p>
        </div>
        <Card className="w-full sm:w-auto bg-light-grayish-green border-none">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-dark-jungle-green">Agent Trust Score</p>
            <p className="text-5xl font-bold text-viridian-green">
              {trustScorePercentage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Details and Reviews Tabs */}
      <Tabs defaultValue="details" className="mt-8">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="reviews">
            Worker Reviews ({agency.reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Details Content */}
        <TabsContent value="details" className="mt-4">
          <Card>
            <CardContent className="p-6 text-slate-700 leading-relaxed">
              {agency.details}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Content */}
        <TabsContent value="reviews" className="mt-4">
          {agency.reviews.length > 0 ? (
            <div className="space-y-6">
              {agency.reviews.map((review, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{review.workerName}</p>
                        <p className="text-xs text-slate-500">
                          {format(review.date, "PPP")}
                        </p>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="mt-4 text-slate-700">{review.reviewText}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center text-slate-500">
                No reviews have been submitted for this agency yet.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
