import User from "../models/User.js";
import bcrypt from "bcryptjs";

/**
 * CREATE USER
 * POST /users/create
 */
export const createUser = async (req, res) => {
  try {
    const creator = req.user;
    const { name, email, password, role, mainRegion, subRegion } = req.body;

    // Only superadmin / admin
    if (!["superadmin","admin"].includes(creator.role)) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    // Region restriction (for non-superadmin)
    if (creator.role !== "superadmin") {
      // creator.mainRegion is ARRAY
      const allowed = mainRegion.some(r =>
        creator.mainRegion.includes(r)
      );
      if (!allowed) {
        return res.status(403).json({ msg: "Region not allowed" });
      }
    }

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ msg: "Email already exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
      mainRegion,   // array
      subRegion     // array
    });

    res.status(201).json({
      msg: "User created",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mainRegion: user.mainRegion,
        subRegion: user.subRegion
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET USERS
 * GET /users/all
 */
export const getUsers = async (req, res) => {
  try {
    const admin = req.user;
    let users;

    if (admin.role === "superadmin") {
      users = await User.find().select("-password");
    } else {
      // show users who share ANY main region
      users = await User.find({
        mainRegion: { $in: admin.mainRegion }
      }).select("-password");
    }

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * UPDATE USER
 * PUT /users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;
    const { name, email, role, mainRegion, subRegion, password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Only superadmin / admin
    if (!["superadmin", "admin"].includes(admin.role)) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    // Region restriction
    if (admin.role !== "superadmin") {
      const allowed = user.mainRegion.some(r =>
        admin.mainRegion.includes(r)
      );
      if (!allowed) {
        return res.status(403).json({ msg: "Region not allowed" });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.mainRegion = mainRegion || user.mainRegion;
    user.subRegion = subRegion || user.subRegion;

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      msg: "User updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mainRegion: user.mainRegion,
        subRegion: user.subRegion
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE USER
 * DELETE /users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const admin = req.user;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Only superadmin can delete
    if (admin.role !== "superadmin") {
      return res.status(403).json({ msg: "Only superadmin can delete users" });
    }

    await user.deleteOne();

    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
