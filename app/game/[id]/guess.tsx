import React from "react";

import { Button, Form, Input } from "antd";

interface FormFieldProps {
  guessedTitle: string;
  guessedArtist: string;
}

interface Props {
  guessed: boolean;
  onHandleGuess: (values: FormFieldProps) => void;
}

const Guess: React.FC<Props> = ({ guessed, onHandleGuess }) => {
  const [form] = Form.useForm<FormFieldProps>();

  return (
    <div>
      <div className="beige-card">
        <h3>
          Guess
        </h3>
        {guessed ? <div>You already guessed correct</div> : (
          <Form
            form={form}
            name="login"
            size="large"
            onFinish={onHandleGuess}
            layout="vertical"
          >
            <Form.Item
              name="guessedTitle"
              rules={[{
                required: true,
                message: "Please enter the title",
              }]}
            >
              <Input placeholder="Title" />
            </Form.Item>
            <Form.Item
              name="guessedArtist"
              rules={[{
                required: true,
                message: "Please enter the artist",
              }]}
            >
              <Input placeholder="Artist" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
              >
                check guess
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  );
};

export default Guess;
