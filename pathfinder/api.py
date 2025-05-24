from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from main import get_optimal_journey
from utils import MtaTrip, Transfer
import uvicorn

app = FastAPI(
    title="NYC Subway Challenge Pathfinder",
    description="Microservice for calculating optimal routes between subway stops",
    version="1.0.0",
)

class TransferModel(BaseModel):
    start_stop_id: str
    end_stop_id: str
    transfer_time_min: int
    is_walking: bool

class MtaTripModel(BaseModel):
    route_id: str
    trip_id: str
    shape_id: str
    service_type: str

class SegmentModel(BaseModel):
    start_stop_id: str
    end_stop_id: str
    mta_trip: MtaTripModel
    all_stops_visited: List[str]

class JourneyModel(BaseModel):
    segments: List[SegmentModel]
    transfers: List[TransferModel]

class RouteResponse(BaseModel):
    journey: JourneyModel
    total_travel_time: int

@app.get("/calculate-route", response_model=RouteResponse)
async def calculate_route(
    stop_ids_already_visited: Optional[str] = None
):
    """
    Calculate the optimal journey to complete the NYC Subway Challenge.
    
    Args:
        stop_ids_already_visited: Comma-separated list of stop IDs that have been visited
    
    Returns:
        RouteResponse: The calculated journey with segments and timing information
    """
    try:
        # Convert comma-separated string to list if provided
        visited_stops = stop_ids_already_visited.split(',') if stop_ids_already_visited else []
        
        # Get the optimal journey
        journey = get_optimal_journey(visited_stops)
        
        # Convert journey to response model
        segments = [
            SegmentModel(
                start_stop_id=segment.start_stop_id,
                end_stop_id=segment.end_stop_id,
                mta_trip=MtaTripModel(
                    route_id=segment.mta_trip.route_id,
                    trip_id=segment.mta_trip.trip_id,
                    shape_id=segment.mta_trip.shape_id,
                    service_type=str(segment.mta_trip._service_type)
                ),
                all_stops_visited=segment.all_stops_visited
            )
            for segment in journey.segments
        ]
        
        transfers = [
            TransferModel(
                start_stop_id=transfer.start_stop_id,
                end_stop_id=transfer.end_stop_id,
                transfer_time_min=transfer.transfer_time_min,
                is_walking=transfer.is_walking
            )
            for transfer in journey.transfers
        ]
        
        return RouteResponse(
            journey=JourneyModel(
                segments=segments,
                transfers=transfers
            ),
            total_travel_time=journey.get_total_travel_time()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
