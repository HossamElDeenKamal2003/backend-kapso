export interface CloudStrategy {
  generateSASToken(args: {
    path: string;
    contentType: string;
  }): Promise<string>;

  makePublic(args: { path: string }): Promise<string>;
}
