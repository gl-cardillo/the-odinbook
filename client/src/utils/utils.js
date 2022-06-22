import axios from 'axios';

export const deletePost = (post, set, render) => {
  axios
    .delete('http://localhost:5000/posts/deletePost', {
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem('token'))}`,
      },
      data: {
        id: post._id,
        picUrl: post.picUrl
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
      'http://localhost:5000/user/sendFriendRequest',
      {
        profileId,
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('token'))}`,
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
      'http://localhost:5000/user/removeFriendRequest',
      {
        profileId,
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('token'))}`,
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
      'http://localhost:5000/user/removeFriend',
      {
        userId,
        profileId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('token'))}`,
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
      'http://localhost:5000/user/acceptFriendRequest',
      {
        userId,
        profileId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('token'))}`,
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
      'http://localhost:5000/user/declineFriendRequest',
      {
        userId,
        profileId,
      },
      {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('token'))}`,
        },
      }
    );
    set((render) => render + 1);
  } catch (error) {
    console.log(error);
  }
};

export function blur(input, set, setShow) {
  input.current.value = '';
  setTimeout(() => {
    set([]);
  }, 200);
}

export function handleSearch(e, set, users) {
  if (e.target.value === '') {
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
