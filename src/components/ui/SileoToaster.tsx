"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "sileo";
import "sileo/styles.css";

export default function SileoToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      position="top-right"
      theme="system"
      offset={{ top: 24, right: 24 }}
      options={{
        roundness: 18,
        duration: 4000,
      }}
    />
  );
}
