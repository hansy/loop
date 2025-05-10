import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ message: "Hello, world!" });
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ message: "Error", error }, { status: 500 });
  }
}
