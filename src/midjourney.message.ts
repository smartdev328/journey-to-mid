import axios from "axios";

export type MJMessage = {
  id: string;
  uri: string;
  hash: string;
  content: string;
};
export class MidjourneyMessage {
  constructor(
    public ChannelId: string,
    protected SalaiToken: string,
    public debug = false,
    public Limit = 50,
    public maxWait = 100
  ) {
    this.log("MidjourneyMessage constructor");
  }
  protected log(...args: any[]) {
    this.debug && console.log(...args, new Date().toISOString());
  }
  async FilterMessages(
    prompt: string,
    loading?: (uri: string) => void,
    options?: string
  ) {
    const data = await this.RetrieveMessages(this.Limit);
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      if (
        item.author.id === "936929561302675456" &&
        item.content.includes(`**${prompt}`)
      ) {
        // this.log(JSON.stringify(item))
        if (options && !item.content.includes(options)) {
          this.log("no options");
          continue;
        }
        if (item.attachments.length === 0) {
          this.log("no attachment");
          break;
        }

        const imageUrl = item.attachments[0].url;
        if (!imageUrl.endsWith(".png")) {
          loading && loading(imageUrl);
          break;
        }
        const content = item.content.split("**")[1];
        const msg: MJMessage = {
          id: item.id,
          uri: imageUrl,
          hash: this.UriToHash(imageUrl),
          content: content,
        };
        return msg;
      }
    }
    return null;
  }
  UriToHash(uri: string) {
    return uri.split("_").pop()?.split(".")[0] ?? "";
  }
  async WaitMessage(prompt: string, loading?: (uri: string) => void) {
    for (let i = 0; i < this.maxWait; i++) {
      const msg = await this.FilterMessages(prompt, loading);
      if (msg !== null) {
        return msg;
      }
      this.log(i, "wait no message found");
      await this.Wait(1000 * 2);
    }
  }
  async WaitOptionMessage(
    content: string,
    options: string,
    loading?: (uri: string) => void
  ) {
    for (let i = 0; i < this.maxWait; i++) {
      const msg = await this.FilterMessages(content, loading, options);
      if (msg !== null) {
        return msg;
      }
      this.log(i, "wait no message found");
      await this.Wait(1000 * 2);
    }
  }

  Wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async RetrieveMessages(limit = 50) {
    const headers = { authorization: this.SalaiToken };
    const response = await axios.get(
      `https://discord.com/api/v10/channels/${this.ChannelId}/messages?limit=${limit}`,
      { headers: headers }
    );
    return response.data;
  }
}
