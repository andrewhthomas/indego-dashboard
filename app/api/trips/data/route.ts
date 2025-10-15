import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Vercel Blob Storage URLs for Indego trip data
    const baseUrl = "https://oilg24vboskpv84u.public.blob.vercel-storage.com";
    const q1Url = `${baseUrl}/indego-trips-2025-q1.csv`;
    const q2Url = `${baseUrl}/indego-trips-2025-q2.csv`;
    const q3Url = `${baseUrl}/indego-trips-2025-q3.csv`;

    const [q1Response, q2Response, q3Response] = await Promise.all([
      fetch(q1Url),
      fetch(q2Url),
      fetch(q3Url),
    ]);

    if (!q1Response.ok || !q2Response.ok || !q3Response.ok) {
      throw new Error("Failed to fetch CSV files from blob storage");
    }

    const [q1Data, q2Data, q3Data] = await Promise.all([
      q1Response.text(),
      q2Response.text(),
      q3Response.text(),
    ]);

    // Get headers from Q1 file (first line)
    const q1Lines = q1Data.split("\n");
    const q2Lines = q2Data.split("\n");
    const q3Lines = q3Data.split("\n");

    // Combine: Q1 headers + Q1 data + Q2 data + Q3 data (skip Q2 and Q3 headers)
    const combinedData = [
      q1Lines[0], // headers
      ...q1Lines.slice(1), // Q1 data
      ...q2Lines.slice(1), // Q2 data (skip headers)
      ...q3Lines.slice(1), // Q3 data (skip headers)
    ].join("\n");

    return new NextResponse(combinedData, {
      headers: {
        "Content-Type": "text/csv",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error fetching CSV files from blob storage:", error);
    return NextResponse.json(
      { error: "Failed to load trip data from blob storage" },
      { status: 500 },
    );
  }
}
