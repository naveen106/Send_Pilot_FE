# Run the Frontend

## Start in development

From the frontend repository root:

~~~bash
npm run dev
~~~

The web app runs at [http://localhost:3000](http://localhost:3000).

## Start a production preview

~~~bash
npm run build
npm run preview
~~~

## Run with Docker

~~~bash
docker build --build-arg VITE_API_URL=/api -t bulkmailer-frontend .
docker run --rm -p 8080:80 bulkmailer-frontend
~~~

Open [http://localhost:8080](http://localhost:8080).

Health check: [http://localhost:8080/health](http://localhost:8080/health)

## Stop the server

- Press Ctrl+C in the terminal running the server.
- For a Docker container running in detached mode:

~~~bash
docker stop <container-name-or-id>
~~~

## Useful checks

~~~bash
npm run check
~~~

