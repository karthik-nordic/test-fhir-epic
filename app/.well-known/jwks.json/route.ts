import { NextResponse } from "next/server";
import { getJWKS } from "../../../lib/epicKeys";

export const GET = async () => {
  return NextResponse.json(getJWKS());
};
