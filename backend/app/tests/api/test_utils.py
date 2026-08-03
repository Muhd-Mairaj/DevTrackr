from httpx import AsyncClient


async def test_ping(client: AsyncClient) -> None:
    """Test the health check endpoint."""
    response = await client.get("/api/utils/ping")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
