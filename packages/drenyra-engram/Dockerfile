FROM golang:1.26-alpine AS builder
WORKDIR /app
ENV GOTOOLCHAIN=auto
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /engram ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates wget
WORKDIR /app
COPY --from=builder /engram /app/engram
RUN mkdir -p /data
ENV PORT=8733
ENV DB_PATH=/data/engram.db
EXPOSE 8733
CMD ["/app/engram"]
