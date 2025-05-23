"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { ProfilePicture } from "@/types/profilePicture";
import withAuth from "@/utils/withAuth";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, Dropdown, Form, Input, message } from "antd";
import { EditOutlined } from "@ant-design/icons";

interface FormFieldProps {
  username?: string;
  birthday?: string;
  profilePicture?: ProfilePicture;
  description?: string;
}

const EditUserProfile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const displayedUsersId = params.id;

  const [user, setUser] = useState<User>({} as User);
  const [profilePictures, setProfilePictures] = useState<ProfilePicture[]>([]);
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<
    ProfilePicture
  >({} as ProfilePicture);
  const [form] = Form.useForm();
  const [isLogedInUser, setIsLogedInUser] = useState<boolean | null>(null);
  const hasHandledNotLoggedInUser = useRef(false);
  const NOT_SET_PLACEHOLDER = <i>Not set</i>;

  const handleGoBack = () => {
    router.back();
  };

  const handleSave = async (values: FormFieldProps) => {
    try {
      const updatedValues = { ...values };

      if (
        selectedProfilePicture && Object.keys(selectedProfilePicture).length > 0
      ) { //only if changed
        updatedValues.profilePicture = selectedProfilePicture;
      }
      if (updatedValues.username === user.username) {
        delete updatedValues.username; // Just a quick change to not get an error when not changing username
      }
      await apiService.put(`/users/${displayedUsersId}`, updatedValues);
      router.push(`/users/${displayedUsersId}`);
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Something went wrong while updating the user`);
      } else {
        message.error("An unknown error occurred while updating the user.");
      }
      console.error(error);
    }
  };

  const items = profilePictures.map((pic) => ({
    key: pic.id,
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 4,
        }}
        onClick={() => {
          setSelectedProfilePicture(pic);
        }}
      >
        <img
          src={pic.url}
          alt={"pic"}
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
  }));

  useEffect(() => {
    const StorageId = sessionStorage.getItem("id");
    if (StorageId != displayedUsersId) {
      if (!hasHandledNotLoggedInUser.current) {
        hasHandledNotLoggedInUser.current = true;
        message.info("You can only edit your own profile.");
        router.back();
      }
    } else {
      setIsLogedInUser(true);
    }

    const fetchUser = async () => {
      try {
        const user: User = await apiService.get<User>(
          `/users/${displayedUsersId}`,
        );
        setUser(user);
        form.setFieldsValue({
          username: user.username,
          birthday: user.birthday ? String(user.birthday).split("T")[0] : "",
          description: user.description || "",
        });
        setSelectedProfilePicture(user.profilePicture);
      } catch (error) {
        if (error instanceof Error) {
          message.error(
            `Something went wrong while loading the user:\n${error.message}`,
          );
        } else {
          message.error("An unknown error occurred while loading the user.");
        }
        console.error(error);
      }
    };

    const fetchProfilePictures = async () => {
      try {
        const profilePictures = await apiService.get<ProfilePicture[]>(
          "/profilePictures",
        );
        setProfilePictures(profilePictures);
      } catch (error) {
        if (error instanceof Error) {
          message.error(
            `Something went wrong while loading the profile pictures:\n${error.message}`,
          );
        } else {
          message.error(
            "An unknown error occurred while loading the profile pictures.",
          );
        }
        console.error(error);
      }
    };

    fetchUser();
    fetchProfilePictures();
  }, [apiService, displayedUsersId, router, form]);

  if (!isLogedInUser) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <div className="card-container">
        <h2>Edit your profile</h2>
        <div className="green-card">
          <Form
            form={form}
            size="large"
            onFinish={handleSave}
            layout="vertical"
          >
            <div
              className={"profile-picture"}
              style={{ position: "relative", marginBottom: "10px" }}
            >
              <img
                src={selectedProfilePicture &&
                    Object.keys(selectedProfilePicture).length > 0
                  ? selectedProfilePicture.url
                  : user.profilePicture?.url}
                alt="profile picture"
              />
              <Dropdown
                menu={{ items }}
                trigger={["click"]}
                placement="bottomLeft"
                overlayClassName="custom-dropdown"
              >
                <div className={"pencil"}>
                  <EditOutlined />
                </div>
              </Dropdown>
            </div>
            <div className="profile-edit-field">
              <strong>Old Username:</strong> {user.username}
            </div>
            <Form.Item
              name="username"
              label={<strong>New Username:</strong>}
              initialValue={user.username}
            >
              <Input />
            </Form.Item>
            <div className="profile-edit-field">
              <strong>Old Birthday:</strong>{" "}
              {user.birthday ? String(user.birthday).split("T")[0] : NOT_SET_PLACEHOLDER}
            </div>
            <Form.Item
              name="birthday"
              label={<strong>New Birthday:</strong>}
              initialValue={user.birthday
                ? String(user.birthday).split("T")[0]
                : ""}
            >
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
            <div className="profile-edit-field">
              <strong>Old Description:</strong> {user.description || NOT_SET_PLACEHOLDER}
            </div>
            <Form.Item
              name="description"
              label={<strong>New Description:</strong>}
              initialValue={user.description || ""}
            >
              <Input.TextArea placeholder="Introduce yourself to other users, for example by listing your favorite games." />
            </Form.Item>
            <div className="profile-buttons">
              <Button onClick={handleGoBack}>Back</Button>
              <Button type="primary" htmlType="submit">Save Changes</Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default withAuth(EditUserProfile);
