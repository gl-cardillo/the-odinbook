import axios from "axios";

export const deletePost = (post, set, render) => {
  axios
    .delete(`${process.env.REACT_APP_API_URL}/posts/deletePost`, {
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
      },
      data: {
        id: post._id,
        picUrl: post.picUrl,
      },
    })
    .then(() => {
      set((render) => render + 1);
    })
    .catch((err) => {
      console.log(err);
    });
};

export const addFriendRequest = async (profileId, userId, set, render) => {
  try {
    await axios.put(
      `${process.env.REACT_APP_API_URL}/user/sendFriendRequest`,
      {
        profileId,
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
      }
    );
    set((render) => render + 1);
  } catch (error) {
    console.log(error);
  }
};

export const removeFriendRequest = async (profileId, userId, set, render) => {
  try {
    await axios.put(
      `${process.env.REACT_APP_API_URL}/user/removeFriendRequest`,
      {
        profileId,
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
      }
    );
    set((render) => render + 1);
  } catch (error) {
    console.log(error);
  }
};

export const removeFriend = async (profileId, userId, set, render) => {
  try {
    await axios.put(
      `${process.env.REACT_APP_API_URL}/user/removeFriend`,
      {
        userId,
        profileId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
      }
    );
    set((renderPost) => renderPost + 1);
  } catch (error) {
    console.log(error);
  }
};

export const acceptRequest = async (profileId, userId, set, render) => {
  try {
    await axios.put(
      `${process.env.REACT_APP_API_URL}/user/acceptFriendRequest`,
      {
        userId,
        profileId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
      }
    );
    set((render) => render + 1);
  } catch (error) {
    console.log(error);
  }
};

export const declineRequest = async (profileId, userId, set, render) => {
  try {
    await axios.put(
      `${process.env.REACT_APP_API_URL}/user/declineFriendRequest`,
      {
        userId,
        profileId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
      }
    );
    set((render) => render + 1);
  } catch (error) {
    console.log(error);
  }
};

export function blur(input, set, setShow) {
  input.current.value = "";
  setTimeout(() => {
    set([]);
  }, 200);
}

export function handleSearch(e, set, users) {
  if (e.target.value === "") {
    set([]);
  } else {
    const newSearch = users.filter((userSearch) => {
      return userSearch.fullname
        .toLowerCase()
        .trim()
        .includes(e.target.value.toLowerCase().trim());
    });
    set(newSearch);
  }
}

export const addLike = (type, element, user, set, postId) => {
  axios
    .put(
      `${process.env.REACT_APP_API_URL}/${type}/addLike`,
      {
        userId: user._id,
        elementId: element.id,
        elementAuthorId: element.authorId,
        postId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("token"))}`,
        },
      }
    )
    .then(() => {
      set((render) => render + 1);
    })
    .catch((err) => {
      console.log(err);
    });
};

export const changePic = async (profileOrCover, file, user, set) => {
  if (
    file.type === "image/bmp" ||
    file.type === "image/gif" ||
    file.type === "image/jpeg" ||
    file.type === "image/png" ||
    file.type === "image/tiff" ||
    file.type === "image/webp"
  ) {
    try {
      // create url to store image
      const url = await axios.get(
        `${process.env.REACT_APP_API_URL}/user/generateUrlS3/`,
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        }
      );
      // sotre image to the url
      await axios.put(url.data, file, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrl = url.data.split("?")[0];

      // update the user in the database with the right url
      await axios.put(
        `${process.env.REACT_APP_API_URL}/user/changePic`,
        {
          imageUrl,
          id: user.id,
          profileOrCover,
        },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(
              localStorage.getItem("token")
            )}`,
          },
        }
      );

      const userUpdate = await axios.get(`/user/profile/${user._id}`);
      localStorage.setItem("user", JSON.stringify(userUpdate.data));
      set((render) => render + 1);
    } catch (error) {
      console.log(error);
    }
  } else {
    alert("Insert a vaild image format (bmp, gif, jpeg, png, tiff, webp)");
  }
};

export function nFormatter(n) {
  if (n > 999999) {
    return `${n / 1000000}m`;
  } else if (n > 999) {
    return `${n / 1000}k`;
  }
  return n;
}

export function getTime(time) {
  let timePassed = Date.now() - new Date(time).getTime();
  let seconds = timePassed / 1000;
  if (seconds < 60) {
    return "now";
  } else if (seconds < 3600) {
    if (seconds / 60 === 1) {
      return "1 minute ago";
    }
    return `${parseInt(seconds / 60)} minutes ago`;
  } else if (seconds < 86400) {
    if (seconds / 3600 === 1) {
      return "1 hour ago";
    }
    return `${parseInt(seconds / 3600)} hours ago`;
  } else if (seconds < 2419200) {
    if (seconds / 86400 === 1) {
      return "1 day ago";
    }
    return `${parseInt(seconds / 86400)} days ago`;
  } else {
    const date = new Date(time);
    return date.toLocaleDateString("en-UK");
  }
}
