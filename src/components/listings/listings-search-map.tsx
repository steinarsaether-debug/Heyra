"use client";

import dynamic from "next/dynamic";
import type { ListingSearchParams, ListingSearchResult } from "@/lib/listing-search";

type ListingsSearchMapProps = {
  results: ListingSearchResult[];
  params: ListingSearchParams;
};

const ListingsSearchMapInner = dynamic(() => import("./listings-search-map-inner"), {
  ssr: false,
});

export function ListingsSearchMap(props: ListingsSearchMapProps) {
  return <ListingsSearchMapInner {...props} />;
}
