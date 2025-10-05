from fastapi import APIRouter, Depends
from typing import List, Dict, Any

from ..es_client import es_client
from .auth import get_current_user
from .. import models

router = APIRouter(
    prefix="/search",
    tags=["search"]
)

@router.get("/", response_model=Dict[str, List[Any]])
async def unified_search(
    q: str,
    current_user: models.User = Depends(get_current_user)
):
    """
    Performs a unified search across users, groups, and posts in Elasticsearch.
    """
    if not q:
        return {"users": [], "groups": [], "posts": []}

    # Define the Elasticsearch query. This "multi_match" query is powerful because
    # it can search for the same text across multiple fields with different weights.
    query = {
        "multi_match": {
            "query": q,
            "fields": [
                "name^2",        # User names are boosted (more relevant)
                "hobbies",
                "title^2",       # Post titles are boosted
                "content",
                "description"
            ],
            "fuzziness": "2" # Automatically handles small typos
        }
    }

    # Perform the search across all three indices at once.
    response = await es_client.search(
        index=["users", "groups", "posts"],
        query=query,
        ignore_unavailable=True
    )

    # Process the results from Elasticsearch
    results = {
        "users": [],
        "groups": [],
        "posts": []
    }
    
    for hit in response["hits"]["hits"]:
        doc = hit["_source"]
        doc_type = hit["_index"]
        
        # Add the document ID to the response
        doc['id'] = hit['_id']

        if doc_type == "users":
            results["users"].append(doc)
        elif doc_type == "groups":
            results["groups"].append(doc)
        elif doc_type == "posts":
            results["posts"].append(doc)

    return results
