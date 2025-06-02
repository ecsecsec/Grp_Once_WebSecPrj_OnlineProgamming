router.put('/set-role/:id', protect, checkAbility('manage', 'all'), async (req, res) => {
  const { role } = req.body;
  await User.findByIdAndUpdate(req.params.id, { role });
  res.json({ msg: 'Cập nhật quyền thành công' });
});
