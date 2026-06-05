import {
  ArtifactEventType,
  cloneArtifactEvent,
  createArtifactEvent,
  type ArtifactEvent,
  type CreateArtifactEventInput
} from "./artifact-event.js";

export interface ArtifactEventSubscriber {
  handle(event: ArtifactEvent): void | Promise<void>;
}

export interface ArtifactEventPublisher {
  publish(event: CreateArtifactEventInput): Promise<ArtifactEvent>;
}

export interface ArtifactEventBus
  extends ArtifactEventPublisher,
    ArtifactEventSubscriber {
  subscribe(subscriber: ArtifactEventSubscriber): () => void;
  subscribeTo(
    eventType: ArtifactEventType,
    subscriber: ArtifactEventSubscriber
  ): () => void;
  listEvents(): ArtifactEvent[];
}

export class InMemoryArtifactEventBus implements ArtifactEventBus {
  private readonly events: ArtifactEvent[] = [];
  private readonly subscribers = new Set<ArtifactEventSubscriber>();
  private readonly subscribersByType = new Map<
    ArtifactEventType,
    Set<ArtifactEventSubscriber>
  >();

  async publish(input: CreateArtifactEventInput): Promise<ArtifactEvent> {
    const event = createArtifactEvent(input, this.events.length + 1);
    this.events.push(cloneArtifactEvent(event));

    await this.notifySubscribers(event);
    return cloneArtifactEvent(event);
  }

  async handle(event: ArtifactEvent): Promise<void> {
    await this.publish({
      artifactId: event.artifactId,
      type: event.type,
      actorId: event.actorId,
      payload: event.payload
    });
  }

  subscribe(subscriber: ArtifactEventSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  subscribeTo(
    eventType: ArtifactEventType,
    subscriber: ArtifactEventSubscriber
  ): () => void {
    const subscribers =
      this.subscribersByType.get(eventType) ?? new Set<ArtifactEventSubscriber>();
    subscribers.add(subscriber);
    this.subscribersByType.set(eventType, subscribers);

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        this.subscribersByType.delete(eventType);
      }
    };
  }

  listEvents(): ArtifactEvent[] {
    return this.events.map(cloneArtifactEvent);
  }

  private async notifySubscribers(event: ArtifactEvent): Promise<void> {
    const subscribers = [
      ...this.subscribers,
      ...(this.subscribersByType.get(event.type) ?? [])
    ];

    for (const subscriber of subscribers) {
      await subscriber.handle(cloneArtifactEvent(event));
    }
  }
}
