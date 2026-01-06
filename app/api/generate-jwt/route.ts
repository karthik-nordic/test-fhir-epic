import { NextResponse } from "next/server";
import { generateClientAssertion } from "@/lib/epicJwt";

export const GET = async () => {
  return NextResponse.json({
    client_assertion: generateClientAssertion()
  });
};
