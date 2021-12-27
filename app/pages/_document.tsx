import Document, {
  Html,
  Head,
  Main,
  NextScript,
} from 'next/document';
import { getCssText } from '@pcs/ui';

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600&amp;display=swap"
            rel="stylesheet"
          ></link>
          <style
            id="stitches"
            dangerouslySetInnerHTML={{ __html: getCssText() }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
