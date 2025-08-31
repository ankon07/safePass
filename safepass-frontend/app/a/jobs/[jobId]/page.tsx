"use client";

import { useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// DUMMY DATA
const initialCandidates = {
  new: [
    {
      id: "c1",
      name: "Rahim Islam",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
    {
      id: "c2",
      name: "Fatima Begum",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
    },
  ],
  verified: [
    {
      id: "c3",
      name: "Karim Ahmed",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
    },
  ],
  interviewing: [],
  offerSent: [
    {
      id: "c4",
      name: "Ali Hasan",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704g",
    },
  ],
};

const columns = {
  new: "New Applicants",
  verified: "Credentials Verified",
  interviewing: "Interviewing",
  offerSent: "Offer Sent",
};

export default function CandidatePipelinePage({
  params,
}: {
  params: { jobId: string };
}) {
  const [candidateState, setCandidateState] = useState(initialCandidates);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceColId = source.droppableId as keyof typeof initialCandidates;
    const destColId = destination.droppableId as keyof typeof initialCandidates;

    const sourceCol = Array.from(candidateState[sourceColId]);
    const destCol =
      sourceColId === destColId
        ? sourceCol
        : Array.from(candidateState[destColId]);

    const [moved] = sourceCol.splice(source.index, 1);
    destCol.splice(destination.index, 0, moved);

    setCandidateState({
      ...candidateState,
      [sourceColId]: sourceCol,
      [destColId]: destCol,
    });
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-dark-jungle-green">
        Candidate Pipeline
      </h1>
      <p className="text-slate-500">Job ID: {params.jobId}</p>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 items-start">
          {Object.entries(columns).map(([colId, title]) => (
            <Droppable key={colId} droppableId={colId}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="bg-slate-50 rounded-lg p-4"
                >
                  <h2 className="font-bold mb-4">
                    {title} (
                    {
                      candidateState[colId as keyof typeof initialCandidates]
                        .length
                    }
                    )
                  </h2>
                  <div className="space-y-4 min-h-[200px]">
                    {candidateState[
                      colId as keyof typeof initialCandidates
                    ].map((candidate, index) => (
                      <Draggable
                        key={candidate.id}
                        draggableId={candidate.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Card>
                              <CardContent className="p-4 flex items-center gap-4">
                                <Avatar>
                                  <AvatarImage src={candidate.avatar} />
                                  <AvatarFallback>
                                    {candidate.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="font-medium">{candidate.name}</p>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
