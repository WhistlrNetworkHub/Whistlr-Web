import { AUTH } from '@lib/api/auth';
import type { NextApiRequest, NextApiResponse } from 'next';
import type {
  TrendsData,
  ErrorResponse,
  TrendsResponse,
  FilteredTrends
} from '@lib/types/place';

type PlaceIdEndpointQuery = {
  id: string;
  limit?: string;
};

export default async function placeIdEndpoint(
  req: NextApiRequest,
  res: NextApiResponse<TrendsResponse | ErrorResponse>
): Promise<void> {
  // TODO: Implement real trends using Supabase or another API
  // For now, return empty trends array to prevent errors
  const data = {
    trends: [],
    location: 'Worldwide'
  };

  res.status(200).json(data);
}
