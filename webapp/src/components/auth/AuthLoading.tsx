import React from "react";
import Container from "@/components/layout/Container";

export default function AuthLoading() {
  return (
    <Container>
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    </Container>
  );
}
