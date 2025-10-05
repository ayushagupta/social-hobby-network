from elasticsearch import AsyncElasticsearch
import asyncio

# Create an asynchronous Elasticsearch client instance.
# This client connects to the Elasticsearch server we started with Docker.
es_client = AsyncElasticsearch("http://localhost:9200")

# A simple function to test the connection.
async def check_es_connection():
    try:
        is_connected = await es_client.ping()
        if is_connected:
            print("Successfully connected to Elasticsearch.")
        else:
            print("Could not connect to Elasticsearch.")
    except Exception as e:
        print(f"An error occurred while connecting to Elasticsearch: {e}")

# This block allows you to run the file directly to test the connection.
if __name__ == "__main__":
    asyncio.run(check_es_connection())